import { describe, expect, it } from "vitest";
import { dataClient } from "@/lib/amplify-server";
import type { MockDataClient } from "@/test/mockDataClient";

// @/lib/amplify-server is mocked globally in vitest.setup.ts.
const mockDataClient = dataClient as unknown as MockDataClient;

const { getListenStatsByAlbum, getPlayedTrackDates } = await import("./listenProgress");

describe("getListenStatsByAlbum", () => {
  it("groups played track ids and tracks the most recent play per album", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [
        { spotifyAlbumId: "album1", spotifyTrackId: "t1", playedAt: "2024-01-01T00:00:00Z" },
        { spotifyAlbumId: "album1", spotifyTrackId: "t2", playedAt: "2024-01-03T00:00:00Z" },
        { spotifyAlbumId: "album1", spotifyTrackId: "t1", playedAt: "2024-01-02T00:00:00Z" },
        { spotifyAlbumId: "album2", spotifyTrackId: "t3", playedAt: "2024-01-01T00:00:00Z" },
      ],
    });

    const result = await getListenStatsByAlbum("user1");

    expect(result.get("album1")).toEqual({
      playedTrackIds: new Set(["t1", "t2"]),
      lastPlayedAt: "2024-01-03T00:00:00Z",
    });
    expect(result.get("album2")).toEqual({
      playedTrackIds: new Set(["t3"]),
      lastPlayedAt: "2024-01-01T00:00:00Z",
    });
    expect(
      mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId
    ).toHaveBeenCalledWith({ spotifyUserId: "user1" });
  });

  it("skips events that have been excluded by a reset", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [
        { spotifyAlbumId: "album1", spotifyTrackId: "t1", playedAt: "2024-01-01T00:00:00Z" },
        {
          spotifyAlbumId: "album1",
          spotifyTrackId: "t2",
          playedAt: "2024-01-03T00:00:00Z",
          excludedAt: "2024-01-04T00:00:00Z",
        },
      ],
    });

    const result = await getListenStatsByAlbum("user1");

    expect(result.get("album1")).toEqual({
      playedTrackIds: new Set(["t1"]),
      lastPlayedAt: "2024-01-01T00:00:00Z",
    });
  });

  it("skips events with no spotifyAlbumId", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [{ spotifyAlbumId: null, spotifyTrackId: "t1", playedAt: "2024-01-01T00:00:00Z" }],
    });

    const result = await getListenStatsByAlbum("user1");

    expect(result.size).toBe(0);
  });

  it("returns an empty map when there are no events", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [],
    });

    const result = await getListenStatsByAlbum("user1");

    expect(result.size).toBe(0);
  });
});

describe("getPlayedTrackDates", () => {
  it("maps each track to its most recent play date", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [
        { spotifyTrackId: "t1", playedAt: "2024-01-01T00:00:00Z" },
        { spotifyTrackId: "t1", playedAt: "2024-01-05T00:00:00Z" },
        { spotifyTrackId: "t2", playedAt: "2024-01-02T00:00:00Z" },
      ],
    });

    const result = await getPlayedTrackDates("user1", "album1");

    expect(result.get("t1")).toBe("2024-01-05T00:00:00Z");
    expect(result.get("t2")).toBe("2024-01-02T00:00:00Z");
    expect(
      mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId
    ).toHaveBeenCalledWith({ spotifyUserId: "user1", spotifyAlbumId: { eq: "album1" } });
  });

  it("skips events that have been excluded by a reset", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [
        { spotifyTrackId: "t1", playedAt: "2024-01-01T00:00:00Z" },
        { spotifyTrackId: "t2", playedAt: "2024-01-02T00:00:00Z", excludedAt: "2024-01-03T00:00:00Z" },
      ],
    });

    const result = await getPlayedTrackDates("user1", "album1");

    expect(result.get("t1")).toBe("2024-01-01T00:00:00Z");
    expect(result.has("t2")).toBe(false);
  });
});
