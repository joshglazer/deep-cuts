import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListenEventRow } from "./ListenEventRow";

const event = {
  trackName: "Karma Police",
  playedAt: "2024-03-05T00:00:00.000Z",
  artistName: "Radiohead",
  albumName: "OK Computer",
  imageUrl: "https://example.com/cover.jpg",
  spotifyAlbumId: "album1",
};

describe("ListenEventRow", () => {
  it("renders the track name as text when no albumHref is given", () => {
    const { container } = render(<ListenEventRow event={event} />);

    expect(screen.getAllByText("Karma Police").length).toBeGreaterThan(0);
    expect(container.querySelector('a[href="/list/album/album1"]')).not.toBeInTheDocument();
  });

  it("links the track name to the album when albumHref is given", () => {
    const { container } = render(
      <ListenEventRow event={event} albumHref="/list/album/album1" />
    );

    expect(container.querySelector('a[href="/list/album/album1"]')).toBeInTheDocument();
  });

  it("shows the artist and album name together", () => {
    render(<ListenEventRow event={event} />);

    expect(screen.getByText("Radiohead · OK Computer")).toBeInTheDocument();
  });

  it("omits the subtitle when artist and album are unknown", () => {
    render(
      <ListenEventRow
        event={{ trackName: "Karma Police", playedAt: "2024-03-05T00:00:00.000Z" }}
      />
    );

    expect(screen.queryByText("·")).not.toBeInTheDocument();
  });

  it("shows the played date", () => {
    render(<ListenEventRow event={event} />);

    expect(screen.getByText("March 5, 2024")).toBeInTheDocument();
  });

  it("wraps the thumbnail in a Spotify deep link when spotifyAlbumId is present", () => {
    const { container } = render(<ListenEventRow event={event} />);

    expect(container.querySelector('a[href="spotify:album:album1"]')).toBeInTheDocument();
  });
});
