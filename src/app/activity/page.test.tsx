import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const requireSpotifyUserIdOrRedirect = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrRedirect }));

const getRecentActivity = vi.fn();
vi.mock("./activityData", () => ({ getRecentActivity }));

// Header is an async server component and crashes when embedded as JSX under
// client-side React (see PageShell.test.tsx) — stubbed so the real PageShell
// still renders.
vi.mock("@/components/Header", () => ({ Header: () => <header data-testid="header-stub" /> }));

const { default: ActivityPage } = await import("./page");

describe("ActivityPage", () => {
  it("shows an empty state when there's no listening history", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    getRecentActivity.mockResolvedValue([]);

    render(await ActivityPage());

    expect(screen.getByText("No listening history yet")).toBeInTheDocument();
  });

  it("renders a row for each recent event", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    getRecentActivity.mockResolvedValue([
      {
        id: "e1",
        trackName: "Karma Police",
        playedAt: "2024-03-05T00:00:00.000Z",
        spotifyAlbumId: "album1",
        albumName: "OK Computer",
        artistName: "Radiohead",
        imageUrl: null,
      },
    ]);

    render(await ActivityPage());

    expect(screen.getByText("Karma Police")).toBeInTheDocument();
    expect(getRecentActivity).toHaveBeenCalledWith("user1");
  });
});
