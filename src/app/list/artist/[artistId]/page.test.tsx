import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockDataClient, type MockDataClient } from "@/test/mockDataClient";

const mockDataClient: MockDataClient = createMockDataClient();
vi.mock("@/lib/amplify-server", () => ({ dataClient: mockDataClient }));

const requireSpotifyUserIdOrRedirect = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrRedirect }));

vi.mock("@/components/PageShell", () => ({
  PageShell: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));
vi.mock("@/app/list/actions", () => ({ removeAlbum: vi.fn(), resetAlbumProgress: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const { default: ArtistListPage } = await import("./page");

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

const params = Promise.resolve({ artistId: "artist1" });
function searchParams(params: { sort?: string; completed?: string } = {}) {
  return Promise.resolve(params);
}

describe("ArtistListPage", () => {
  it("shows an empty state and falls back to 'Artist' as the title when there are no albums", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    mockDataClient.models.Album.list.mockResolvedValue({ data: [] });
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );

    render(await ArtistListPage({ params, searchParams: searchParams() }));

    expect(screen.getByText("No albums on your list for this artist")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Artist" })).toBeInTheDocument();
  });

  it("uses the artist's name from the albums as the page title", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    mockDataClient.models.Album.list.mockResolvedValue({ data: [album()] });
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );

    render(await ArtistListPage({ params, searchParams: searchParams() }));

    expect(screen.getByRole("heading", { name: "Radiohead" })).toBeInTheDocument();
    expect(screen.getAllByText("OK Computer").length).toBeGreaterThan(0);
  });

  it("shows an all-caught-up empty state when every album is completed and completed is hidden", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    mockDataClient.models.Album.list.mockResolvedValue({
      data: [album({ completedAt: "2024-01-01" })],
    });
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue(
      { data: [] }
    );

    render(await ArtistListPage({ params, searchParams: searchParams() }));

    expect(screen.getByText("All caught up")).toBeInTheDocument();
  });
});
