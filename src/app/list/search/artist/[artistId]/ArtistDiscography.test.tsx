import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
            albumType: "album",
          },
        ]}
      />
    );

    expect(screen.getAllByText("OK Computer").length).toBeGreaterThan(0);
  });

  it("hides singles by default and reveals them via the toggle", async () => {
    const user = userEvent.setup();
    render(
      <ArtistDiscography
        albums={[
          {
            spotifyAlbumId: "album1",
            spotifyArtistId: "artist1",
            name: "OK Computer",
            artistName: "Radiohead",
            totalTracks: 12,
            albumType: "album",
          },
          {
            spotifyAlbumId: "single1",
            spotifyArtistId: "artist1",
            name: "Creep",
            artistName: "Radiohead",
            totalTracks: 1,
            albumType: "single",
          },
        ]}
      />
    );

    expect(screen.getAllByText("OK Computer").length).toBeGreaterThan(0);
    expect(screen.queryByText("Creep")).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Include singles & other releases" }));

    expect((await screen.findAllByText("Creep")).length).toBeGreaterThan(0);
  });
});
