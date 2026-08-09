import { describe, expect, it } from "vitest";
import { dataClient } from "@/lib/amplify-server";
import type { MockDataClient } from "@/test/mockDataClient";

// @/lib/amplify-server is mocked globally in vitest.setup.ts.
const mockDataClient = dataClient as unknown as MockDataClient;

const { listAllListenEvents } = await import("./listenEvents");

describe("listAllListenEvents", () => {
  it("returns every event from a single page", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [{ spotifyTrackId: "t1" }, { spotifyTrackId: "t2" }] }
    );

    const result = await listAllListenEvents({ spotifyUserId: "user1" });

    expect(result).toEqual([{ spotifyTrackId: "t1" }, { spotifyTrackId: "t2" }]);
    expect(
      mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId
    ).toHaveBeenCalledWith({ spotifyUserId: "user1" }, { nextToken: undefined });
  });

  it("drains every page until nextToken is exhausted", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId
      .mockResolvedValueOnce({ data: [{ spotifyTrackId: "t1" }], nextToken: "page2" })
      .mockResolvedValueOnce({ data: [{ spotifyTrackId: "t2" }], nextToken: null });

    const result = await listAllListenEvents({ spotifyUserId: "user1" });

    expect(result).toEqual([{ spotifyTrackId: "t1" }, { spotifyTrackId: "t2" }]);
    expect(
      mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId
    ).toHaveBeenNthCalledWith(1, { spotifyUserId: "user1" }, { nextToken: undefined });
    expect(
      mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId
    ).toHaveBeenNthCalledWith(2, { spotifyUserId: "user1" }, { nextToken: "page2" });
  });

  it("passes the key through unchanged, e.g. an album-scoped filter", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );

    await listAllListenEvents({ spotifyUserId: "user1", spotifyAlbumId: { eq: "album1" } });

    expect(
      mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId
    ).toHaveBeenCalledWith(
      { spotifyUserId: "user1", spotifyAlbumId: { eq: "album1" } },
      { nextToken: undefined }
    );
  });
});
