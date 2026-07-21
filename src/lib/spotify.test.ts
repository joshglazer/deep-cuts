import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as SpotifyModule from "./spotify";

function jsonResponse(body: unknown, init?: Partial<{ status: number; headers: Record<string, string> }>) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;
let spotify: typeof SpotifyModule;

beforeEach(async () => {
  vi.resetModules();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("AUTH_SPOTIFY_ID", "client-id");
  vi.stubEnv("AUTH_SPOTIFY_SECRET", "client-secret");
  spotify = await import("./spotify");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("search", () => {
  it("fetches an app access token then searches artists and albums in one call", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "app-token", expires_in: 3600 }))
      .mockResolvedValueOnce(
        jsonResponse({ artists: { items: [{ id: "a1" }] }, albums: { items: [{ id: "al1" }] } })
      );

    const result = await spotify.search("radiohead");

    expect(result.artists.items).toEqual([{ id: "a1" }]);
    expect(result.albums.items).toEqual([{ id: "al1" }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://accounts.spotify.com/api/token");
    expect(fetchMock.mock.calls[1][0]).toContain("/search?type=artist,album&q=radiohead");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer app-token");
  });

  it("reuses a cached app token across calls", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "app-token", expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ artists: { items: [] }, albums: { items: [] } }))
      .mockResolvedValueOnce(jsonResponse({ artists: { items: [] }, albums: { items: [] } }));

    await spotify.search("first");
    await spotify.search("second");

    // Only one token fetch across both searches.
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws when Spotify client credentials are missing", async () => {
    vi.stubEnv("AUTH_SPOTIFY_ID", "");
    vi.stubEnv("AUTH_SPOTIFY_SECRET", "");

    await expect(spotify.search("query")).rejects.toThrow(/Missing AUTH_SPOTIFY_ID/);
  });

  it("throws a descriptive error when the token request fails", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("invalid_client", { status: 401 })
    );

    await expect(spotify.search("query")).rejects.toThrow(
      /Spotify client-credentials auth error 401/
    );
  });
});

describe("spotifyFetch retry behavior (via getAlbum)", () => {
  it("retries on 429 honoring Retry-After, then succeeds", async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "app-token", expires_in: 3600 }))
      .mockResolvedValueOnce(
        new Response("rate limited", { status: 429, headers: { "Retry-After": "1" } })
      )
      .mockResolvedValueOnce(jsonResponse({ id: "album1" }));

    const promise = spotify.getAlbum("album1");
    // Let the token fetch + first 429 attempt resolve, then advance the retry timer.
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result).toEqual({ id: "album1" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it("gives up after the max number of 429 retries", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(jsonResponse({ access_token: "app-token", expires_in: 3600 }));
    for (let i = 0; i < 4; i++) {
      fetchMock.mockResolvedValueOnce(
        new Response("rate limited", { status: 429, headers: {} })
      );
    }

    const promise = spotify.getAlbum("album1");
    const assertion = expect(promise).rejects.toThrow(/Spotify API error 429/);
    await vi.advanceTimersByTimeAsync(10000);
    await assertion;
    vi.useRealTimers();
  });

  it("throws a descriptive error on a non-429 failure", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "app-token", expires_in: 3600 }))
      .mockResolvedValueOnce(new Response("not found", { status: 404 }));

    await expect(spotify.getAlbum("missing")).rejects.toThrow(/Spotify API error 404/);
  });
});

describe("getArtists", () => {
  it("joins ids into a comma-separated query param", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "app-token", expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ artists: [] }));

    await spotify.getArtists(["id1", "id2"]);

    expect(fetchMock.mock.calls[1][0]).toContain("/artists?ids=id1,id2");
  });
});

describe("getArtistAlbums", () => {
  it("paginates through every page and concatenates items", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "app-token", expires_in: 3600 }))
      .mockResolvedValueOnce(
        jsonResponse({ items: [{ id: "a1" }], next: "https://api.spotify.com/v1/next-page" })
      )
      .mockResolvedValueOnce(jsonResponse({ items: [{ id: "a2" }], next: null }));

    const albums = await spotify.getArtistAlbums("artist1");

    expect(albums).toEqual([{ id: "a1" }, { id: "a2" }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("refreshAccessToken", () => {
  it("returns the refreshed token, falling back to the input refresh token when omitted", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ access_token: "new-access", expires_in: 3600 }));

    const result = await spotify.refreshAccessToken("old-refresh");

    expect(result.accessToken).toBe("new-access");
    expect(result.refreshToken).toBe("old-refresh");
    expect(typeof result.expiresAt).toBe("number");
  });

  it("uses the rotated refresh token when Spotify returns one", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ access_token: "new-access", refresh_token: "rotated", expires_in: 3600 })
    );

    const result = await spotify.refreshAccessToken("old-refresh");

    expect(result.refreshToken).toBe("rotated");
  });
});

describe("getRecentlyPlayed", () => {
  it("fetches recently played items with the given access token", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await spotify.getRecentlyPlayed("user-token");

    expect(fetchMock.mock.calls[0][0]).toContain("/me/player/recently-played?limit=50");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer user-token");
  });
});
