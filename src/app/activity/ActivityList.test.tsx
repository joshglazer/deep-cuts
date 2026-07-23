import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityList } from "./ActivityList";

const event = {
  id: "e1",
  trackName: "Karma Police",
  playedAt: "2024-03-05T00:00:00.000Z",
  spotifyAlbumId: "album1",
  albumName: "OK Computer",
  artistName: "Radiohead",
  imageUrl: null,
};

describe("ActivityList", () => {
  it("renders a row per event, linked to its album", () => {
    const { container } = render(<ActivityList activity={[event]} />);

    expect(screen.getAllByText("Karma Police").length).toBeGreaterThan(0);
    expect(container.querySelector('a[href="/list/album/album1"]')).toBeInTheDocument();
  });

  it("omits the album link when the event has no spotifyAlbumId", () => {
    const { container } = render(
      <ActivityList activity={[{ ...event, spotifyAlbumId: null }]} />
    );

    expect(container.querySelector('a[href^="/list/album/"]')).not.toBeInTheDocument();
  });
});
