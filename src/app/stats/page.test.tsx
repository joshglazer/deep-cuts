import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const requireSpotifyUserIdOrRedirect = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrRedirect }));

const getStats = vi.fn();
vi.mock("./statsData", () => ({ getStats }));

vi.mock("@/components/PageShell", () => ({
  PageShell: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

const { default: StatsPage } = await import("./page");

describe("StatsPage", () => {
  it("shows an empty state when there's no listening history", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    getStats.mockResolvedValue({
      totalStreams: 0,
      thisWeek: { count: 0, previousCount: 0 },
      thisMonth: { count: 0, previousCount: 0 },
      streakDays: 0,
      heatmap: [],
    });

    render(await StatsPage());

    expect(screen.getByText("No listening history yet")).toBeInTheDocument();
  });

  it("renders stat tiles and the heatmap once there's listening history", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    getStats.mockResolvedValue({
      totalStreams: 42,
      thisWeek: { count: 5, previousCount: 3 },
      thisMonth: { count: 20, previousCount: 10 },
      streakDays: 3,
      heatmap: [{ date: "2024-06-12", count: 1, level: 1, isFuture: false }],
    });

    render(await StatsPage());

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Day streak")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
