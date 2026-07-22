import { describe, expect, it, vi } from "vitest";
import { dataClient } from "@/lib/amplify-server";
import type { MockDataClient } from "@/test/mockDataClient";

// @/lib/amplify-server is mocked globally in vitest.setup.ts.
const mockDataClient = dataClient as unknown as MockDataClient;

const requireSignedIn = vi.fn();
const requireSpotifyUserIdOrThrow = vi.fn();
vi.mock("@/auth", () => ({ requireSignedIn, requireSpotifyUserIdOrThrow }));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath }));

const searchSpotify = vi.fn();
const getArtists = vi.fn();
const getArtistAlbums = vi.fn();
vi.mock("@/lib/spotify", () => ({
  search: searchSpotify,
  getArtists,
  getArtistAlbums,
}));

const {
  search,
  getArtistDiscography,
  addAlbum,
  removeAlbum,
  resetAlbumProgress,
  resetTrackProgress,
} = await import("./actions");

const spotifyAlbum = {
  id: "album1",
  name: "OK Computer",
  images: [{ url: "https://example.com/cover.jpg" }],
  artists: [{ id: "artist1", name: "Radiohead", images: [] }],
  release_date: "1997-05-21",
  total_tracks: 12,
};

describe("search", () => {
  it("requires a signed-in session and returns an empty result for a blank query", async () => {
    requireSignedIn.mockResolvedValue(undefined);

    const result = await search("   ");

    expect(result).toEqual({ artists: [], albums: [] });
    expect(searchSpotify).not.toHaveBeenCalled();
  });

  it("maps Spotify search results into the app's shapes", async () => {
    requireSignedIn.mockResolvedValue(undefined);
    searchSpotify.mockResolvedValue({
      artists: { items: [{ id: "artist1", name: "Radiohead", images: [{ url: "a.jpg" }] }] },
      albums: { items: [spotifyAlbum] },
    });

    const result = await search("radiohead");

    expect(result.artists).toEqual([
      { spotifyArtistId: "artist1", name: "Radiohead", imageUrl: "a.jpg" },
    ]);
    expect(result.albums).toEqual([
      {
        spotifyAlbumId: "album1",
        spotifyArtistId: "artist1",
        name: "OK Computer",
        artistName: "Radiohead",
        imageUrl: "https://example.com/cover.jpg",
        releaseYear: "1997",
        totalTracks: 12,
      },
    ]);
  });

  it("propagates the auth error when not signed in", async () => {
    requireSignedIn.mockRejectedValue(new Error("Not signed in"));

    await expect(search("query")).rejects.toThrow("Not signed in");
  });
});

describe("getArtistDiscography", () => {
  it("dedupes albums by name, keeping the earliest release", async () => {
    requireSignedIn.mockResolvedValue(undefined);
    getArtists.mockResolvedValue({
      artists: [{ id: "artist1", name: "Radiohead", images: [{ url: "artist.jpg" }] }],
    });
    getArtistAlbums.mockResolvedValue([
      { ...spotifyAlbum, id: "us-release", release_date: "1997-06-01" },
      { ...spotifyAlbum, id: "uk-release", release_date: "1997-05-21" },
      { ...spotifyAlbum, id: "kid-a", name: "Kid A", release_date: "2000-10-02" },
    ]);

    const result = await getArtistDiscography("artist1");

    expect(result.artistName).toBe("Radiohead");
    expect(result.imageUrl).toBe("artist.jpg");
    expect(result.albums.map((a) => a.spotifyAlbumId)).toEqual(["uk-release", "kid-a"]);
  });

  it("falls back to a generic name when the artist isn't found", async () => {
    requireSignedIn.mockResolvedValue(undefined);
    getArtists.mockResolvedValue({ artists: [] });
    getArtistAlbums.mockResolvedValue([]);

    const result = await getArtistDiscography("missing");

    expect(result.artistName).toBe("Artist");
    expect(result.imageUrl).toBeUndefined();
    expect(result.albums).toEqual([]);
  });
});

describe("addAlbum", () => {
  const album = {
    spotifyAlbumId: "album1",
    spotifyArtistId: "artist1",
    name: "OK Computer",
    artistName: "Radiohead",
    imageUrl: "cover.jpg",
    totalTracks: 12,
  };

  it("skips adding when the album is already on the user's list", async () => {
    requireSpotifyUserIdOrThrow.mockResolvedValue("user1");
    mockDataClient.models.Album.list.mockResolvedValue({ data: [{ id: "existing" }] });

    await addAlbum(album);

    expect(mockDataClient.models.Album.create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("creates the album and revalidates /list when not already present", async () => {
    requireSpotifyUserIdOrThrow.mockResolvedValue("user1");
    mockDataClient.models.Album.list.mockResolvedValue({ data: [] });
    mockDataClient.models.Album.create.mockResolvedValue({ data: {} });

    await addAlbum(album);

    expect(mockDataClient.models.Album.create).toHaveBeenCalledWith(
      expect.objectContaining({ spotifyUserId: "user1", spotifyAlbumId: "album1" })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/list");
  });
});

describe("removeAlbum", () => {
  it("does nothing when the album doesn't belong to the signed-in user", async () => {
    requireSpotifyUserIdOrThrow.mockResolvedValue("user1");
    mockDataClient.models.Album.get.mockResolvedValue({
      data: { id: "row1", spotifyUserId: "other-user" },
    });

    await removeAlbum("row1");

    expect(mockDataClient.models.Album.delete).not.toHaveBeenCalled();
  });

  it("does nothing when the album doesn't exist", async () => {
    requireSpotifyUserIdOrThrow.mockResolvedValue("user1");
    mockDataClient.models.Album.get.mockResolvedValue({ data: null });

    await removeAlbum("row1");

    expect(mockDataClient.models.Album.delete).not.toHaveBeenCalled();
  });

  it("deletes the album and revalidates /list when it belongs to the user", async () => {
    requireSpotifyUserIdOrThrow.mockResolvedValue("user1");
    mockDataClient.models.Album.get.mockResolvedValue({
      data: { id: "row1", spotifyUserId: "user1" },
    });

    await removeAlbum("row1");

    expect(mockDataClient.models.Album.delete).toHaveBeenCalledWith({ id: "row1" });
    expect(revalidatePath).toHaveBeenCalledWith("/list");
  });
});

describe("resetAlbumProgress", () => {
  it("does nothing when the album doesn't belong to the signed-in user", async () => {
    requireSpotifyUserIdOrThrow.mockResolvedValue("user1");
    mockDataClient.models.Album.get.mockResolvedValue({
      data: { id: "row1", spotifyUserId: "other-user" },
    });

    await resetAlbumProgress("row1");

    expect(
      mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId
    ).not.toHaveBeenCalled();
  });

  it("deletes listen events, clears completedAt, and revalidates all album paths", async () => {
    requireSpotifyUserIdOrThrow.mockResolvedValue("user1");
    mockDataClient.models.Album.get.mockResolvedValue({
      data: {
        id: "row1",
        spotifyUserId: "user1",
        spotifyAlbumId: "album1",
        spotifyArtistId: "artist1",
        completedAt: "2024-01-01",
      },
    });
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [{ id: "event1" }, { id: "event2" }] }
    );

    await resetAlbumProgress("row1");

    expect(mockDataClient.models.ListenEvent.delete).toHaveBeenCalledTimes(2);
    expect(mockDataClient.models.Album.update).toHaveBeenCalledWith({
      id: "row1",
      completedAt: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/list");
    expect(revalidatePath).toHaveBeenCalledWith("/list/album/album1");
    expect(revalidatePath).toHaveBeenCalledWith("/list/artist/artist1");
  });

  it("skips clearing completedAt when the album wasn't completed", async () => {
    requireSpotifyUserIdOrThrow.mockResolvedValue("user1");
    mockDataClient.models.Album.get.mockResolvedValue({
      data: {
        id: "row1",
        spotifyUserId: "user1",
        spotifyAlbumId: "album1",
        spotifyArtistId: "artist1",
        completedAt: null,
      },
    });
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );

    await resetAlbumProgress("row1");

    expect(mockDataClient.models.Album.update).not.toHaveBeenCalled();
  });
});

describe("resetTrackProgress", () => {
  it("does nothing when there were no matching listen events", async () => {
    requireSpotifyUserIdOrThrow.mockResolvedValue("user1");
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );

    await resetTrackProgress("album1", "track1");

    expect(mockDataClient.models.Album.list).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("deletes only the matching track's events and clears completedAt if set", async () => {
    requireSpotifyUserIdOrThrow.mockResolvedValue("user1");
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      {
        data: [
          { id: "event1", spotifyTrackId: "track1" },
          { id: "event2", spotifyTrackId: "track2" },
        ],
      }
    );
    mockDataClient.models.Album.list.mockResolvedValue({
      data: [
        {
          id: "row1",
          spotifyArtistId: "artist1",
          completedAt: "2024-01-01",
        },
      ],
    });

    await resetTrackProgress("album1", "track1");

    expect(mockDataClient.models.ListenEvent.delete).toHaveBeenCalledTimes(1);
    expect(mockDataClient.models.ListenEvent.delete).toHaveBeenCalledWith({ id: "event1" });
    expect(mockDataClient.models.Album.update).toHaveBeenCalledWith({
      id: "row1",
      completedAt: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/list/artist/artist1");
  });
});
