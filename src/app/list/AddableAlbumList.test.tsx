import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// actions.ts imports @/auth, which doesn't resolve under Vitest (see
// CLAUDE.md) — stubbed rather than pulling that chain in.
const addAlbum = vi.fn();
vi.mock("./actions", () => ({ addAlbum }));

const { AddableAlbumList } = await import("./AddableAlbumList");

const album = {
  spotifyAlbumId: "album1",
  spotifyArtistId: "artist1",
  name: "OK Computer",
  artistName: "Radiohead",
  totalTracks: 12,
  albumType: "album" as const,
};

describe("AddableAlbumList", () => {
  it("renders an Add button per album, switching to Added once clicked", async () => {
    addAlbum.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AddableAlbumList albums={[album]} />);

    const addButton = screen.getByRole("button", { name: "Add" });
    await user.click(addButton);

    expect(await screen.findByRole("button", { name: "Added" })).toBeDisabled();
    expect(addAlbum).toHaveBeenCalledWith(album);
  });

  it("shows a dismissable error banner when adding fails", async () => {
    addAlbum.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<AddableAlbumList albums={[album]} />);

    await user.click(screen.getByRole("button", { name: "Add" }));

    const banner = await screen.findByText("Couldn't add that album. Try again.");
    expect(banner).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByText("Couldn't add that album. Try again.")).not.toBeInTheDocument();
  });
});
