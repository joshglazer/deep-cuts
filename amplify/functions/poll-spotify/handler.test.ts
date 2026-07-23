import { describe, expect, it, vi } from "vitest";

// handler.ts configures Amplify and generates its data client at module
// load time (top-level await), so all of this has to be mocked before the
// dynamic import below — none of it can be swapped in per-test.
const { client } = vi.hoisted(() => ({
  client: {
    models: {
      SpotifyAuth: { list: vi.fn(), update: vi.fn() },
      Album: { list: vi.fn(), update: vi.fn() },
      ListenEvent: {
        listListenEventBySpotifyUserIdAndSpotifyAlbumId: vi.fn(),
        create: vi.fn(),
      },
    },
  },
}));

// "$amplify/env/poll-spotify" is resolved to src/test/pollSpotifyEnvStub.ts
// via vitest.config.ts's resolve.alias, not mocked here — see that file for why.
vi.mock("@aws-amplify/backend/function/runtime", () => ({
  getAmplifyDataClientConfig: vi.fn().mockResolvedValue({ resourceConfig: {}, libraryOptions: {} }),
}));
vi.mock("aws-amplify", () => ({ Amplify: { configure: vi.fn() } }));
vi.mock("aws-amplify/data", () => ({ generateClient: () => client }));

const getRecentlyPlayed = vi.fn();
const refreshAccessToken = vi.fn();
vi.mock("../../../src/lib/spotify", () => ({ getRecentlyPlayed, refreshAccessToken }));

const { handler } = await import("./handler");

function recentlyPlayedItem(overrides: {
  trackId: string;
  albumId: string;
  playedAt: string;
  trackName?: string;
  artistId?: string;
}) {
  return {
    track: {
      id: overrides.trackId,
      name: overrides.trackName ?? "Track",
      album: { id: overrides.albumId, artists: [{ id: overrides.artistId ?? "artist1" }] },
    },
    played_at: overrides.playedAt,
  };
}

const oneUser = [{ spotifyUserId: "user1", refreshToken: "stored-refresh-token" }];

function mockNoOpDefaults() {
  refreshAccessToken.mockResolvedValue({
    accessToken: "access-token",
    refreshToken: "stored-refresh-token",
  });
  getRecentlyPlayed.mockResolvedValue({ items: [] });
  client.models.Album.list.mockResolvedValue({ data: [] });
  client.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
    data: [],
  });
  client.models.ListenEvent.create.mockResolvedValue({ data: {} });
  client.models.Album.update.mockResolvedValue({ data: {} });
  client.models.SpotifyAuth.update.mockResolvedValue({ data: {} });
}

describe("handler", () => {
  it("does nothing when there are no SpotifyAuth records", async () => {
    client.models.SpotifyAuth.list.mockResolvedValue({ data: [] });

    await handler({}, {} as never, vi.fn());

    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("logs and returns without polling anyone when listing SpotifyAuth fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    client.models.SpotifyAuth.list.mockResolvedValue({ data: null, errors: [{ message: "boom" }] });

    await handler({}, {} as never, vi.fn());

    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "poll-spotify: failed to list SpotifyAuth records",
      [{ message: "boom" }]
    );
    consoleError.mockRestore();
  });

  it("continues polling remaining users when one user's poll throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    client.models.SpotifyAuth.list.mockResolvedValue({
      data: [
        { spotifyUserId: "user1", refreshToken: "rt1" },
        { spotifyUserId: "user2", refreshToken: "rt2" },
      ],
    });
    mockNoOpDefaults();
    refreshAccessToken.mockRejectedValueOnce(new Error("refresh failed"));

    await handler({}, {} as never, vi.fn());

    expect(refreshAccessToken).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledWith(
      "poll-spotify: failed for user user1",
      new Error("refresh failed")
    );
    consoleError.mockRestore();
  });
});

describe("pollUser (via handler)", () => {
  it("stores a refreshed token when Spotify rotates it", async () => {
    client.models.SpotifyAuth.list.mockResolvedValue({ data: oneUser });
    mockNoOpDefaults();
    refreshAccessToken.mockResolvedValue({ accessToken: "new-access", refreshToken: "new-refresh" });

    await handler({}, {} as never, vi.fn());

    expect(client.models.SpotifyAuth.update).toHaveBeenCalledWith(
      expect.objectContaining({ spotifyUserId: "user1", refreshToken: "new-refresh" })
    );
  });

  it("doesn't touch SpotifyAuth when the refresh token is unchanged", async () => {
    client.models.SpotifyAuth.list.mockResolvedValue({ data: oneUser });
    mockNoOpDefaults();

    await handler({}, {} as never, vi.fn());

    expect(client.models.SpotifyAuth.update).not.toHaveBeenCalled();
  });

  it("stops before querying albums when there's no recently-played history", async () => {
    client.models.SpotifyAuth.list.mockResolvedValue({ data: oneUser });
    mockNoOpDefaults();

    await handler({}, {} as never, vi.fn());

    expect(client.models.Album.list).not.toHaveBeenCalled();
  });

  it("ignores recently-played tracks whose album isn't on the user's list", async () => {
    client.models.SpotifyAuth.list.mockResolvedValue({ data: oneUser });
    mockNoOpDefaults();
    getRecentlyPlayed.mockResolvedValue({
      items: [recentlyPlayedItem({ trackId: "t1", albumId: "unlisted-album", playedAt: "2024-01-01T00:00:00Z" })],
    });
    client.models.Album.list.mockResolvedValue({
      data: [{ id: "row1", spotifyAlbumId: "album1", totalTracks: 2, completedAt: null }],
    });

    await handler({}, {} as never, vi.fn());

    expect(client.models.ListenEvent.create).not.toHaveBeenCalled();
  });

  it("records a new play for a track on a listed album", async () => {
    client.models.SpotifyAuth.list.mockResolvedValue({ data: oneUser });
    mockNoOpDefaults();
    getRecentlyPlayed.mockResolvedValue({
      items: [
        recentlyPlayedItem({
          trackId: "t1",
          albumId: "album1",
          playedAt: "2024-01-01T00:00:00Z",
          trackName: "Airbag",
          artistId: "artist1",
        }),
      ],
    });
    client.models.Album.list.mockResolvedValue({
      data: [{ id: "row1", spotifyAlbumId: "album1", totalTracks: 2, completedAt: null }],
    });

    await handler({}, {} as never, vi.fn());

    expect(client.models.ListenEvent.create).toHaveBeenCalledWith({
      spotifyUserId: "user1",
      spotifyTrackId: "t1",
      spotifyAlbumId: "album1",
      spotifyArtistId: "artist1",
      trackName: "Airbag",
      playedAt: "2024-01-01T00:00:00Z",
    });
  });

  it("doesn't recreate a play that's already recorded as an active ListenEvent", async () => {
    client.models.SpotifyAuth.list.mockResolvedValue({ data: oneUser });
    mockNoOpDefaults();
    getRecentlyPlayed.mockResolvedValue({
      items: [recentlyPlayedItem({ trackId: "t1", albumId: "album1", playedAt: "2024-01-01T00:00:00Z" })],
    });
    client.models.Album.list.mockResolvedValue({
      data: [{ id: "row1", spotifyAlbumId: "album1", totalTracks: 2, completedAt: null }],
    });
    client.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [{ spotifyTrackId: "t1", playedAt: "2024-01-01T00:00:00Z", spotifyAlbumId: "album1" }],
    });

    await handler({}, {} as never, vi.fn());

    expect(client.models.ListenEvent.create).not.toHaveBeenCalled();
  });

  // The actual bug this fix addresses: resetTrackProgress/resetAlbumProgress
  // soft-delete a ListenEvent (excludedAt set) rather than hard-deleting it,
  // specifically so this dedupe check still finds it and refuses to recreate
  // it — even though Spotify's own recently-played history keeps serving
  // that exact play for a while after the reset.
  it("does not resurrect a play the user reset, even though Spotify still reports it as recently played", async () => {
    client.models.SpotifyAuth.list.mockResolvedValue({ data: oneUser });
    mockNoOpDefaults();
    getRecentlyPlayed.mockResolvedValue({
      items: [recentlyPlayedItem({ trackId: "t1", albumId: "album1", playedAt: "2024-01-01T00:00:00Z" })],
    });
    client.models.Album.list.mockResolvedValue({
      data: [{ id: "row1", spotifyAlbumId: "album1", totalTracks: 2, completedAt: null }],
    });
    client.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [
        {
          spotifyTrackId: "t1",
          playedAt: "2024-01-01T00:00:00Z",
          spotifyAlbumId: "album1",
          excludedAt: "2024-01-02T00:00:00Z",
        },
      ],
    });

    await handler({}, {} as never, vi.fn());

    expect(client.models.ListenEvent.create).not.toHaveBeenCalled();
  });

  it("excludes soft-deleted plays from the completion count", async () => {
    client.models.SpotifyAuth.list.mockResolvedValue({ data: oneUser });
    mockNoOpDefaults();
    // Reports t2 as freshly played; t1's only record is excluded (reset), so
    // the album should stay at 1/2 played rather than reading as complete.
    getRecentlyPlayed.mockResolvedValue({
      items: [recentlyPlayedItem({ trackId: "t2", albumId: "album1", playedAt: "2024-01-05T00:00:00Z" })],
    });
    client.models.Album.list.mockResolvedValue({
      data: [{ id: "row1", spotifyAlbumId: "album1", totalTracks: 2, completedAt: null }],
    });
    client.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [
        {
          spotifyTrackId: "t1",
          playedAt: "2024-01-01T00:00:00Z",
          spotifyAlbumId: "album1",
          excludedAt: "2024-01-02T00:00:00Z",
        },
      ],
    });

    await handler({}, {} as never, vi.fn());

    expect(client.models.Album.update).not.toHaveBeenCalled();
  });

  it("marks an album complete once every track has an active (non-excluded) play", async () => {
    client.models.SpotifyAuth.list.mockResolvedValue({ data: oneUser });
    mockNoOpDefaults();
    getRecentlyPlayed.mockResolvedValue({
      items: [recentlyPlayedItem({ trackId: "t2", albumId: "album1", playedAt: "2024-01-05T00:00:00Z" })],
    });
    client.models.Album.list.mockResolvedValue({
      data: [{ id: "row1", spotifyAlbumId: "album1", totalTracks: 2, completedAt: null }],
    });
    client.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [{ spotifyTrackId: "t1", playedAt: "2024-01-01T00:00:00Z", spotifyAlbumId: "album1" }],
    });

    await handler({}, {} as never, vi.fn());

    expect(client.models.Album.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: "row1", completedAt: expect.any(String) })
    );
  });

  it("doesn't re-check completion for an album that's already marked complete", async () => {
    client.models.SpotifyAuth.list.mockResolvedValue({ data: oneUser });
    mockNoOpDefaults();
    getRecentlyPlayed.mockResolvedValue({
      items: [recentlyPlayedItem({ trackId: "t1", albumId: "album1", playedAt: "2024-01-05T00:00:00Z" })],
    });
    client.models.Album.list.mockResolvedValue({
      data: [{ id: "row1", spotifyAlbumId: "album1", totalTracks: 1, completedAt: "2023-12-31T00:00:00Z" }],
    });

    await handler({}, {} as never, vi.fn());

    expect(client.models.Album.update).not.toHaveBeenCalled();
  });
});
