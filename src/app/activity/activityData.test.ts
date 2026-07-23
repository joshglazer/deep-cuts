import { describe, expect, it } from "vitest";
import { dataClient } from "@/lib/amplify-server";
import type { MockDataClient } from "@/test/mockDataClient";

// @/lib/amplify-server is mocked globally in vitest.setup.ts.
const mockDataClient = dataClient as unknown as MockDataClient;

const { getRecentActivity } = await import("./activityData");

describe("getRecentActivity", () => {
  it("sorts events most-recent-first and joins album details", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [
        { id: "e1", trackName: "Airbag", playedAt: "2024-01-01T00:00:00Z", spotifyAlbumId: "album1" },
        { id: "e2", trackName: "Karma Police", playedAt: "2024-01-03T00:00:00Z", spotifyAlbumId: "album1" },
      ],
    });
    mockDataClient.models.Album.list.mockResolvedValue({
      data: [
        {
          spotifyAlbumId: "album1",
          name: "OK Computer",
          artistName: "Radiohead",
          imageUrl: "https://example.com/cover.jpg",
        },
      ],
    });

    const result = await getRecentActivity("user1");

    expect(result).toEqual([
      {
        id: "e2",
        trackName: "Karma Police",
        playedAt: "2024-01-03T00:00:00Z",
        spotifyAlbumId: "album1",
        albumName: "OK Computer",
        artistName: "Radiohead",
        imageUrl: "https://example.com/cover.jpg",
      },
      {
        id: "e1",
        trackName: "Airbag",
        playedAt: "2024-01-01T00:00:00Z",
        spotifyAlbumId: "album1",
        albumName: "OK Computer",
        artistName: "Radiohead",
        imageUrl: "https://example.com/cover.jpg",
      },
    ]);
    expect(
      mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId
    ).toHaveBeenCalledWith({ spotifyUserId: "user1" });
    expect(mockDataClient.models.Album.list).toHaveBeenCalledWith({
      filter: { spotifyUserId: { eq: "user1" } },
    });
  });

  it("omits album details when the event's album isn't in the user's list", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [{ id: "e1", trackName: "Airbag", playedAt: "2024-01-01T00:00:00Z", spotifyAlbumId: null }],
    });
    mockDataClient.models.Album.list.mockResolvedValue({ data: [] });

    const result = await getRecentActivity("user1");

    expect(result).toEqual([
      {
        id: "e1",
        trackName: "Airbag",
        playedAt: "2024-01-01T00:00:00Z",
        spotifyAlbumId: null,
        albumName: undefined,
        artistName: undefined,
        imageUrl: undefined,
      },
    ]);
  });

  it("returns an empty list when there's no listening history", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [],
    });
    mockDataClient.models.Album.list.mockResolvedValue({ data: [] });

    const result = await getRecentActivity("user1");

    expect(result).toEqual([]);
  });
});
