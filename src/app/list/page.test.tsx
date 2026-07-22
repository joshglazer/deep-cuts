import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dataClient } from "@/lib/amplify-server";
import type { MockDataClient } from "@/test/mockDataClient";

// @/lib/amplify-server is mocked globally in vitest.setup.ts.
const mockDataClient = dataClient as unknown as MockDataClient;

const requireSpotifyUserIdOrRedirect = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrRedirect }));

const getArtists = vi.fn();
vi.mock("@/lib/spotify", () => ({ getArtists }));

// Header is an async server component and crashes when embedded as JSX under
// client-side React (see PageShell.test.tsx) — stubbed so the real PageShell
// still renders.
vi.mock("@/components/Header", () => ({ Header: () => <header data-testid="header-stub" /> }));
// AlbumRowActionMenu (rendered per row via AlbumList) imports actions.ts,
// which imports @/auth — next-auth's module graph doesn't resolve under
// Vitest. Stubbed the same way as AlbumList.test.tsx.
vi.mock("./actions", () => ({ removeAlbum: vi.fn(), resetAlbumProgress: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/list",
  useSearchParams: () => new URLSearchParams(),
}));

const { default: ListPage } = await import("./page");

function album(overrides: Record<string, unknown> = {}) {
  return {
    id: "row1",
    name: "OK Computer",
    artistName: "Radiohead",
    imageUrl: null,
    spotifyAlbumId: "album1",
    spotifyArtistId: "artist1",
    totalTracks: 12,
    completedAt: null,
    addedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function searchParams(params: { view?: string; sort?: string; completed?: string } = {}) {
  return Promise.resolve(params);
}

describe("ListPage", () => {
  it("shows an empty state when the user has no albums", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    mockDataClient.models.Album.list.mockResolvedValue({ data: [] });
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );

    render(await ListPage({ searchParams: searchParams() }));

    expect(screen.getByText("Nothing on your list yet")).toBeInTheDocument();
  });

  it("shows an all-caught-up empty state when every album is completed and completed is hidden", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    mockDataClient.models.Album.list.mockResolvedValue({
      data: [album({ completedAt: "2024-01-01" })],
    });
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );

    render(await ListPage({ searchParams: searchParams() }));

    expect(screen.getByText("All caught up")).toBeInTheDocument();
  });

  it("renders the album list by default", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    mockDataClient.models.Album.list.mockResolvedValue({ data: [album()] });
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );

    render(await ListPage({ searchParams: searchParams() }));

    expect(screen.getAllByText("OK Computer").length).toBeGreaterThan(0);
  });

  it("groups albums by artist in artist view", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    mockDataClient.models.Album.list.mockResolvedValue({
      data: [
        album({ id: "row1", spotifyAlbumId: "album1", name: "OK Computer" }),
        album({ id: "row2", spotifyAlbumId: "album2", name: "Kid A" }),
      ],
    });
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );
    getArtists.mockResolvedValue({ artists: [] });

    render(await ListPage({ searchParams: searchParams({ view: "artist" }) }));

    expect(screen.getByRole("link", { name: "Radiohead" })).toBeInTheDocument();
    expect(screen.getByText("2 albums")).toBeInTheDocument();
  });

  it("falls back to the album-cover image when the Spotify artist lookup fails", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    mockDataClient.models.Album.list.mockResolvedValue({ data: [album()] });
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );
    getArtists.mockRejectedValue(new Error("Spotify unavailable"));

    render(await ListPage({ searchParams: searchParams({ view: "artist" }) }));

    expect(screen.getByRole("link", { name: "Radiohead" })).toBeInTheDocument();
  });
});
