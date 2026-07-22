import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// actions.ts imports @/auth, which doesn't resolve under Vitest (see
// CLAUDE.md) — stubbed rather than pulling that chain in.
const addAlbum = vi.fn();
vi.mock("@/app/list/actions", () => ({ addAlbum }));

const { ArtistDiscography } = await import("./ArtistDiscography");

describe("ArtistDiscography", () => {
  it("shows an empty state when the artist has no albums", () => {
    render(<ArtistDiscography albums={[]} />);
    expect(screen.getByText("No albums found")).toBeInTheDocument();
  });

  it("renders the album list when there are albums", () => {
    render(
      <ArtistDiscography
        albums={[
          {
            spotifyAlbumId: "album1",
            spotifyArtistId: "artist1",
            name: "OK Computer",
            artistName: "Radiohead",
            totalTracks: 12,
          },
        ]}
      />
    );

    expect(screen.getAllByText("OK Computer").length).toBeGreaterThan(0);
  });
});
