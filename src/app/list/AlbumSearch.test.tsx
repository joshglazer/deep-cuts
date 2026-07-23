import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// actions.ts imports @/auth, which doesn't resolve under Vitest (see
// CLAUDE.md) — stubbed rather than pulling that chain in.
const search = vi.fn();
const addAlbum = vi.fn();
vi.mock("./actions", () => ({ search, addAlbum }));
// Astryx's real Button calls its own internal useTransition(), which
// collides with AlbumSearch's `isLoading={isSearching}` transition and
// deterministically crashes react-dom's dev-mode hook-count check (verified
// in isolation — unrelated to this test file). Button has its own coverage
// elsewhere, so it's stubbed here to exercise AlbumSearch's own state logic.
vi.mock("@/design/atoms/Button", () => ({
  Button: ({
    label,
    isDisabled,
    isLoading,
    ...props
  }: {
    label: string;
    isDisabled?: boolean;
    isLoading?: boolean;
    type?: "button" | "submit";
    onClick?: () => void;
  }) => (
    <button {...props} disabled={isDisabled} aria-busy={isLoading}>
      {label}
    </button>
  ),
}));

const { AlbumSearch } = await import("./AlbumSearch");

describe("AlbumSearch", () => {
  it("searches on submit and renders album results", async () => {
    search.mockResolvedValue({
      artists: [],
      albums: [
        {
          spotifyAlbumId: "album1",
          spotifyArtistId: "artist1",
          name: "OK Computer",
          artistName: "Radiohead",
          totalTracks: 12,
          albumType: "album",
        },
      ],
    });
    const user = userEvent.setup();
    render(<AlbumSearch />);

    await user.type(
      screen.getByRole("textbox", { name: "Search for an artist or album" }),
      "radiohead"
    );
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("Radiohead")).toBeInTheDocument();
    expect(search).toHaveBeenCalledWith("radiohead");
  });

  it("disables the search button until a query is entered", () => {
    render(<AlbumSearch />);

    expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
  });

  it("shows a dismissable error banner when the search fails", async () => {
    search.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<AlbumSearch />);

    await user.type(
      screen.getByRole("textbox", { name: "Search for an artist or album" }),
      "radiohead"
    );
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("Couldn't search Spotify. Try again.")).toBeInTheDocument();
  });

  it("switches between album and artist result views", async () => {
    search.mockResolvedValue({
      artists: [{ spotifyArtistId: "artist1", name: "Radiohead", imageUrl: undefined }],
      albums: [
        {
          spotifyAlbumId: "album1",
          spotifyArtistId: "artist1",
          name: "OK Computer",
          artistName: "Radiohead",
          totalTracks: 12,
          albumType: "album",
        },
      ],
    });
    const user = userEvent.setup();
    const { container } = render(<AlbumSearch />);

    await user.type(
      screen.getByRole("textbox", { name: "Search for an artist or album" }),
      "radiohead"
    );
    await user.click(screen.getByRole("button", { name: "Search" }));
    await screen.findAllByText("OK Computer");

    await user.click(screen.getByRole("radio", { name: "Artists" }));

    expect(
      container.querySelector('a[href="/list/search/artist/artist1"]')
    ).toBeInTheDocument();
    expect(screen.queryByText("OK Computer")).not.toBeInTheDocument();
  });

  it("hides singles by default and reveals them via the toggle", async () => {
    search.mockResolvedValue({
      artists: [],
      albums: [
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
      ],
    });
    const user = userEvent.setup();
    render(<AlbumSearch />);

    await user.type(
      screen.getByRole("textbox", { name: "Search for an artist or album" }),
      "radiohead"
    );
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect((await screen.findAllByText("OK Computer")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Creep")).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Include singles & other releases" }));

    expect((await screen.findAllByText("Creep")).length).toBeGreaterThan(0);
  });
});
