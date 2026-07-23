import { describe, expect, it } from "vitest";
import { dataClient } from "@/lib/amplify-server";
import type { MockDataClient } from "@/test/mockDataClient";

// @/lib/amplify-server is mocked globally in vitest.setup.ts.
const mockDataClient = dataClient as unknown as MockDataClient;

const { getListenEvents } = await import("./statsData");

describe("getListenEvents", () => {
  it("returns each event's playedAt", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [
        { id: "e1", spotifyTrackId: "t1", playedAt: "2024-06-12T10:00:00.000Z" },
        { id: "e2", spotifyTrackId: "t2", playedAt: "2024-06-11T10:00:00.000Z" },
      ],
    });

    const result = await getListenEvents("user1");

    expect(result).toEqual([
      { playedAt: "2024-06-12T10:00:00.000Z" },
      { playedAt: "2024-06-11T10:00:00.000Z" },
    ]);
  });

  it("excludes soft-deleted (reset) events", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [
        { id: "e1", spotifyTrackId: "t1", playedAt: "2024-06-12T10:00:00.000Z" },
        {
          id: "e2",
          spotifyTrackId: "t2",
          playedAt: "2024-06-11T10:00:00.000Z",
          excludedAt: "2024-06-12T13:00:00.000Z",
        },
      ],
    });

    const result = await getListenEvents("user1");

    expect(result).toEqual([{ playedAt: "2024-06-12T10:00:00.000Z" }]);
  });
});
