import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const requireSpotifyUserIdOrRedirect = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrRedirect }));

// actions.ts calls further @/auth exports than requireSpotifyUserIdOrRedirect
// (mocked above) covers, so the action functions themselves are stubbed too.
const getArtistDiscography = vi.fn();
vi.mock("@/app/list/actions", () => ({ getArtistDiscography, addAlbum: vi.fn() }));

// Header is an async server component and crashes when embedded as JSX under
// client-side React (see PageShell.test.tsx) — stubbed so the real PageShell
// still renders.
vi.mock("@/components/Header", () => ({ Header: () => <header data-testid="header-stub" /> }));

const { default: ArtistDiscographyPage } = await import("./page");

const params = Promise.resolve({ artistId: "artist1" });

describe("ArtistDiscographyPage", () => {
  it("requires a signed-in session and renders the artist's discography", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    getArtistDiscography.mockResolvedValue({
      artistName: "Radiohead",
      imageUrl: "artist.jpg",
      albums: [],
    });

    render(await ArtistDiscographyPage({ params }));

    expect(requireSpotifyUserIdOrRedirect).toHaveBeenCalled();
    expect(getArtistDiscography).toHaveBeenCalledWith("artist1");
    expect(screen.getByRole("heading", { name: "Radiohead" })).toBeInTheDocument();
    expect(screen.getByText("No albums found")).toBeInTheDocument();
  });
});
