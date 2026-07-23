import { describe, expect, it, vi } from "vitest";
import { dataClient } from "@/lib/amplify-server";
import type { MockDataClient } from "@/test/mockDataClient";

// @/lib/amplify-server is mocked globally in vitest.setup.ts.
const mockDataClient = dataClient as unknown as MockDataClient;

const requireSpotifyUserIdOrThrow = vi.fn();
const signOut = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrThrow, signOut }));

const { deleteAccount } = await import("./actions");

describe("deleteAccount", () => {
  it("deletes every album, artist, listen event, and the stored refresh token, then signs out", async () => {
    requireSpotifyUserIdOrThrow.mockResolvedValue("user1");
    mockDataClient.models.Album.list.mockResolvedValue({
      data: [{ id: "album-row1" }, { id: "album-row2" }],
    });
    mockDataClient.models.Artist.list.mockResolvedValue({
      data: [{ id: "artist-row1" }],
    });
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [{ id: "event1" }, { id: "event2" }, { id: "event3" }] }
    );

    await deleteAccount();

    expect(mockDataClient.models.Album.list).toHaveBeenCalledWith({
      filter: { spotifyUserId: { eq: "user1" } },
    });
    expect(mockDataClient.models.Artist.list).toHaveBeenCalledWith({
      filter: { spotifyUserId: { eq: "user1" } },
    });
    expect(
      mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId
    ).toHaveBeenCalledWith({ spotifyUserId: "user1" });

    expect(mockDataClient.models.Album.delete).toHaveBeenCalledTimes(2);
    expect(mockDataClient.models.Album.delete).toHaveBeenCalledWith({ id: "album-row1" });
    expect(mockDataClient.models.Album.delete).toHaveBeenCalledWith({ id: "album-row2" });

    expect(mockDataClient.models.Artist.delete).toHaveBeenCalledTimes(1);
    expect(mockDataClient.models.Artist.delete).toHaveBeenCalledWith({ id: "artist-row1" });

    expect(mockDataClient.models.ListenEvent.delete).toHaveBeenCalledTimes(3);
    expect(mockDataClient.models.ListenEvent.delete).toHaveBeenCalledWith({ id: "event1" });
    expect(mockDataClient.models.ListenEvent.delete).toHaveBeenCalledWith({ id: "event2" });
    expect(mockDataClient.models.ListenEvent.delete).toHaveBeenCalledWith({ id: "event3" });

    expect(mockDataClient.models.SpotifyAuth.delete).toHaveBeenCalledWith({
      spotifyUserId: "user1",
    });

    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/" });
  });

  it("propagates the auth error when not signed in, without deleting or signing out", async () => {
    requireSpotifyUserIdOrThrow.mockRejectedValue(new Error("Not signed in"));

    await expect(deleteAccount()).rejects.toThrow("Not signed in");

    expect(mockDataClient.models.Album.list).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });
});
