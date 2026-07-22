import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
// AlbumRowActionMenu (rendered as each row's endContent) imports actions.ts,
// which imports @/auth — next-auth's module graph doesn't resolve under
// Vitest (it imports "next/server" in a way Vite can't follow), so the
// action functions are stubbed rather than pulling that chain in.
vi.mock("./actions", () => ({
  removeAlbum: vi.fn(),
  resetAlbumProgress: vi.fn(),
}));

const { AlbumList } = await import("./AlbumList");

const baseAlbum = {
  id: "row1",
  name: "OK Computer",
  artistName: "Radiohead",
  imageUrl: null,
  spotifyAlbumId: "album1",
  spotifyArtistId: "artist1",
  totalTracks: 12,
  completedAt: null,
};

describe("AlbumList", () => {
  it("renders a row per album, linked to its album and artist pages", () => {
    const { container } = render(<AlbumList albums={[baseAlbum]} listenStatsByAlbum={new Map()} />);

    expect(screen.getAllByText("OK Computer").length).toBeGreaterThan(0);
    expect(container.querySelector('a[href="/list/album/album1"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/list/artist/artist1"]')).toBeInTheDocument();
  });

  it("derives played-track progress from listenStatsByAlbum", () => {
    const listenStatsByAlbum = new Map([
      ["album1", { playedTrackIds: new Set(["t1", "t2", "t3"]), lastPlayedAt: "2024-01-01" }],
    ]);

    render(<AlbumList albums={[baseAlbum]} listenStatsByAlbum={listenStatsByAlbum} />);

    expect(screen.getByText("3/12 tracks")).toBeInTheDocument();
  });

  it("omits progress when the album has no totalTracks", () => {
    render(
      <AlbumList
        albums={[{ ...baseAlbum, totalTracks: null }]}
        listenStatsByAlbum={new Map()}
      />
    );

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
