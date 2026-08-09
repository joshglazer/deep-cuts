import { describe, expect, it } from "vitest";
import { dataClient } from "@/lib/amplify-server";
import type { MockDataClient } from "@/test/mockDataClient";

// @/lib/amplify-server is mocked globally in vitest.setup.ts.
const mockDataClient = dataClient as unknown as MockDataClient;

const { getPlayedTrackDates } = await import("./listenProgress");

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
    ).toHaveBeenCalledWith(
      { spotifyUserId: "user1", spotifyAlbumId: { eq: "album1" } },
      { nextToken: undefined }
    );
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
