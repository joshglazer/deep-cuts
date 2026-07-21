import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const requireSpotifyUserIdOrRedirect = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrRedirect }));

const getArtistDiscography = vi.fn();
vi.mock("@/app/list/actions", () => ({ getArtistDiscography, addAlbum: vi.fn() }));

vi.mock("@/components/PageShell", () => ({
  PageShell: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

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
