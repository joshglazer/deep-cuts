import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const requireSpotifyUserIdOrRedirect = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrRedirect }));

const getListenEvents = vi.fn();
vi.mock("./statsData", () => ({ getListenEvents }));

// Header is an async server component and crashes when embedded as JSX under
// client-side React (see PageShell.test.tsx) — stubbed so the real PageShell
// still renders.
vi.mock("@/components/Header", () => ({ Header: () => <header data-testid="header-stub" /> }));

const { default: StatsPage } = await import("./page");

beforeEach(() => {
  // A Wednesday, so week/month math below has a predictable "days into" count.
  vi.setSystemTime(new Date("2024-06-12T10:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("StatsPage", () => {
  it("shows an empty state when there's no listening history", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    getListenEvents.mockResolvedValue([]);

    render(await StatsPage());

    expect(screen.getByText("No listening history yet")).toBeInTheDocument();
  });

  it("renders stat tiles and the heatmap once there's listening history", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    getListenEvents.mockResolvedValue([
      { playedAt: "2024-05-15T12:00:00.000Z" }, // previous month, outside the trend window
      { playedAt: "2024-06-01T12:00:00.000Z" },
      { playedAt: "2024-06-05T12:00:00.000Z" },
      { playedAt: "2024-06-09T12:00:00.000Z" },
      { playedAt: "2024-06-12T12:00:00.000Z" }, // today
    ]);

    render(await StatsPage());

    expect(screen.getByText("Total songs streamed")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // total songs streamed
    expect(screen.getByText("Day streak")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // streak: only today is consecutive
    expect(screen.getByText("Listening activity")).toBeInTheDocument();
  });
});
