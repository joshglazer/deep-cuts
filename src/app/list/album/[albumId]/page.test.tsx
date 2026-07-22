import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dataClient } from "@/lib/amplify-server";
import type { MockDataClient } from "@/test/mockDataClient";

// @/lib/amplify-server is mocked globally in vitest.setup.ts.
const mockDataClient = dataClient as unknown as MockDataClient;

const requireSpotifyUserIdOrRedirect = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrRedirect }));

const getAlbum = vi.fn();
vi.mock("@/lib/spotify", () => ({ getAlbum }));

vi.mock("@/components/PageShell", () => ({
  PageShell: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));
const resetTrackProgress = vi.fn();
vi.mock("@/app/list/actions", () => ({ resetTrackProgress }));

const { default: AlbumTracksPage } = await import("./page");

const params = Promise.resolve({ albumId: "album1" });

const spotifyAlbum = {
  id: "album1",
  name: "OK Computer",
  images: [{ url: "https://example.com/cover.jpg" }],
  artists: [{ id: "artist1", name: "Radiohead" }],
  release_date: "1997-05-21",
  tracks: {
    items: [
      { id: "track1", name: "Airbag", track_number: 1, duration_ms: 284000 },
      { id: "track2", name: "Paranoid Android", track_number: 2, duration_ms: 383000 },
    ],
  },
};

describe("AlbumTracksPage", () => {
  it("shows an error state when the Spotify album lookup fails", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    getAlbum.mockRejectedValue(new Error("Spotify unavailable"));
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );
    mockDataClient.models.Album.list.mockResolvedValue({ data: [] });

    render(await AlbumTracksPage({ params }));

    expect(screen.getByText("Couldn't load this album")).toBeInTheDocument();
  });

  it("renders every track with its formatted duration", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    getAlbum.mockResolvedValue(spotifyAlbum);
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );
    mockDataClient.models.Album.list.mockResolvedValue({ data: [] });

    render(await AlbumTracksPage({ params }));

    expect(screen.getByText("1. Airbag")).toBeInTheDocument();
    expect(screen.getByText("4:44")).toBeInTheDocument();
    expect(screen.getByText("2. Paranoid Android")).toBeInTheDocument();
    expect(screen.getByText("6:23")).toBeInTheDocument();
  });

  it("shows a reset button and streamed date only for played tracks", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    getAlbum.mockResolvedValue(spotifyAlbum);
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      {
        data: [
          { spotifyTrackId: "track1", playedAt: "2024-03-05T00:00:00.000Z" },
        ],
      }
    );
    mockDataClient.models.Album.list.mockResolvedValue({ data: [] });

    render(await AlbumTracksPage({ params }));

    expect(
      screen.getByRole("button", { name: "Reset progress for Airbag" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reset progress for Paranoid Android" })
    ).not.toBeInTheDocument();
  });

  it("shows the completed badge when the listed album has a completedAt", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    getAlbum.mockResolvedValue(spotifyAlbum);
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );
    mockDataClient.models.Album.list.mockResolvedValue({
      data: [{ completedAt: "2024-03-05T00:00:00.000Z" }],
    });

    render(await AlbumTracksPage({ params }));

    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});
