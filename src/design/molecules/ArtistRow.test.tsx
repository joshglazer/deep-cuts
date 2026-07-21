import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArtistRow } from "./ArtistRow";

describe("ArtistRow", () => {
  it("renders the artist name as a link to the given href", () => {
    render(<ArtistRow name="Radiohead" href="/list/artist/1" />);

    const link = screen.getByRole("link", { name: "Radiohead" });
    expect(link).toHaveAttribute("href", "/list/artist/1");
  });

  it("omits the album count when not provided", () => {
    render(<ArtistRow name="Radiohead" href="/list/artist/1" />);

    expect(screen.queryByText(/album/)).not.toBeInTheDocument();
  });

  it("pluralizes the album count for counts other than one", () => {
    render(<ArtistRow name="Radiohead" href="/list/artist/1" albumCount={3} />);

    expect(screen.getByText("3 albums")).toBeInTheDocument();
  });

  it("uses the singular form for exactly one album", () => {
    render(<ArtistRow name="Radiohead" href="/list/artist/1" albumCount={1} />);

    expect(screen.getByText("1 album")).toBeInTheDocument();
  });
});
