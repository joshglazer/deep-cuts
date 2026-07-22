import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

// actions.ts imports @/auth, which doesn't resolve under Vitest (see
// CLAUDE.md) — stubbed rather than pulling that chain in.
const removeAlbum = vi.fn();
const resetAlbumProgress = vi.fn();
vi.mock("./actions", () => ({ removeAlbum, resetAlbumProgress }));

const openWindow = vi.fn();
vi.stubGlobal("open", openWindow);

const { AlbumRowActionMenu } = await import("./AlbumRowActionMenu");

const album = {
  id: "row1",
  name: "OK Computer",
  artistName: "Radiohead",
  spotifyAlbumId: "album1",
  spotifyArtistId: "artist1",
};

async function openMenu() {
  const user = userEvent.setup();
  render(<AlbumRowActionMenu album={album} />);
  await user.click(screen.getByRole("button", { name: "OK Computer actions" }));
  return user;
}

describe("AlbumRowActionMenu", () => {
  it("opens the album in Spotify via a spotify: deep link", async () => {
    const user = await openMenu();

    await user.click(screen.getByRole("menuitem", { name: "Play", hidden: true }));

    expect(openWindow).toHaveBeenCalledWith("spotify:album:album1", "_blank");
  });

  it("navigates to the album progress page", async () => {
    const user = await openMenu();

    await user.click(screen.getByRole("menuitem", { name: "Progress", hidden: true }));

    expect(push).toHaveBeenCalledWith("/list/album/album1");
  });

  it("navigates to the artist's list page", async () => {
    const user = await openMenu();

    await user.click(screen.getByRole("menuitem", { name: "Artist Albums", hidden: true }));

    expect(push).toHaveBeenCalledWith("/list/artist/artist1");
  });

  it("navigates to the artist's search page", async () => {
    const user = await openMenu();

    await user.click(screen.getByRole("menuitem", { name: "Add More", hidden: true }));

    expect(push).toHaveBeenCalledWith("/list/search/artist/artist1");
  });

  it("confirms and resets progress for the album", async () => {
    resetAlbumProgress.mockResolvedValue(undefined);
    const user = await openMenu();

    await user.click(screen.getByRole("menuitem", { name: "Reset Progress", hidden: true }));
    expect(
      screen.getByText('Mark every track on "OK Computer" by Radiohead as unplayed?')
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(resetAlbumProgress).toHaveBeenCalledWith("row1");
  });

  it("confirms and removes the album", async () => {
    removeAlbum.mockResolvedValue(undefined);
    const user = await openMenu();

    await user.click(screen.getByRole("menuitem", { name: "Remove", hidden: true }));
    expect(
      screen.getByText('Remove "OK Computer" by Radiohead from your list?')
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(removeAlbum).toHaveBeenCalledWith("row1");
  });
});
