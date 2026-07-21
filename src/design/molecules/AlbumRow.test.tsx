import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AlbumRow } from "./AlbumRow";

const album = {
  name: "OK Computer",
  artistName: "Radiohead",
  imageUrl: "https://example.com/cover.jpg",
  spotifyAlbumId: "album1",
  releaseYear: "1997",
  totalTracks: 12,
};

describe("AlbumRow", () => {
  it("renders the album and artist name as text when no hrefs are given", () => {
    const { container } = render(<AlbumRow album={album} />);

    expect(screen.getAllByText("OK Computer").length).toBeGreaterThan(0);
    expect(screen.getByText("Radiohead")).toBeInTheDocument();
    // The only link present is the thumbnail's Spotify deep link, not a
    // navigable link to the album/artist page.
    expect(container.querySelector('a[href="/list/album/album1"]')).not.toBeInTheDocument();
  });

  it("links the album and artist names when hrefs are given", () => {
    const { container } = render(
      <AlbumRow album={album} href="/list/album/album1" artistHref="/list/artist/artist1" />
    );

    expect(container.querySelector('a[href="/list/album/album1"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/list/artist/artist1"]')).toBeInTheDocument();
  });

  it("shows release year and track count when there's no progress", () => {
    render(<AlbumRow album={album} />);

    expect(screen.getByText("1997 · 12 tracks")).toBeInTheDocument();
  });

  it("shows a progress bar and played count once at least one track has played", () => {
    render(<AlbumRow album={album} progress={{ played: 3, total: 12 }} />);

    expect(screen.getByText("3/12 tracks")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "3 of 12 tracks played" })
    ).toBeInTheDocument();
  });

  it("hides the progress bar when nothing has been played yet", () => {
    render(<AlbumRow album={album} progress={{ played: 0, total: 12 }} />);

    expect(screen.getByText("12 tracks")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("treats a completed album as fully played even with a stale played count", () => {
    render(
      <AlbumRow
        album={album}
        progress={{ played: 3, total: 12 }}
        completedAt="2024-01-01T00:00:00.000Z"
      />
    );

    expect(screen.getByText("12/12 tracks")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "12 of 12 tracks played" })
    ).toBeInTheDocument();
  });

  it("renders a completed tooltip with the completion date when completedAt is set", () => {
    render(
      <AlbumRow
        album={album}
        progress={{ played: 12, total: 12 }}
        completedAt="2024-03-05T00:00:00.000Z"
      />
    );

    expect(screen.getByText("Completed March 5, 2024")).toBeInTheDocument();
  });

  it("renders endContent when given", () => {
    render(<AlbumRow album={album} endContent={<button type="button">Remove</button>} />);

    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("wraps the thumbnail in a Spotify deep link when spotifyAlbumId is present", () => {
    const { container } = render(<AlbumRow album={album} />);

    expect(container.querySelector('a[href="spotify:album:album1"]')).toBeInTheDocument();
  });
});
