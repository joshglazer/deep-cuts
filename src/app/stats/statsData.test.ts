import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dataClient } from "@/lib/amplify-server";
import type { MockDataClient } from "@/test/mockDataClient";

// @/lib/amplify-server is mocked globally in vitest.setup.ts.
const mockDataClient = dataClient as unknown as MockDataClient;

const { getStats } = await import("./statsData");

function eventsOn(...dateKeys: string[]) {
  return dateKeys.map((dateKey, i) => ({
    id: `e${i}`,
    spotifyTrackId: `t${i}`,
    playedAt: `${dateKey}T12:00:00.000Z`,
  }));
}

beforeEach(() => {
  // A Wednesday, so week/month math below has a predictable "days into" count.
  vi.setSystemTime(new Date("2024-06-12T10:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getStats", () => {
  it("returns zeroed stats when there are no listen events", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [],
    });

    const result = await getStats("user1");

    expect(result.totalStreams).toBe(0);
    expect(result.thisWeek).toEqual({ count: 0, previousCount: 0 });
    expect(result.thisMonth).toEqual({ count: 0, previousCount: 0 });
    expect(result.streakDays).toBe(0);
    expect(result.heatmap).toHaveLength(52 * 7);
    expect(result.heatmap.every((day) => day.count === 0 && day.level === 0)).toBe(true);
  });

  it("counts total streams and marks future heatmap days", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: eventsOn("2024-06-12"),
    });

    const result = await getStats("user1");

    expect(result.totalStreams).toBe(1);
    const futureDay = result.heatmap.find((day) => day.date === "2024-06-13");
    expect(futureDay?.isFuture).toBe(true);
    expect(futureDay?.count).toBe(0);
    const today = result.heatmap.find((day) => day.date === "2024-06-12");
    expect(today?.isFuture).toBe(false);
    expect(today?.count).toBe(1);
  });

  it("excludes soft-deleted (reset) events from totals and the heatmap", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [
        ...eventsOn("2024-06-12"),
        { ...eventsOn("2024-06-12")[0], id: "excluded", excludedAt: "2024-06-12T13:00:00.000Z" },
      ],
    });

    const result = await getStats("user1");

    expect(result.totalStreams).toBe(1);
    expect(result.heatmap.find((day) => day.date === "2024-06-12")?.count).toBe(1);
  });

  it("computes this-week and previous-week counts over the same number of days into each week", async () => {
    // Week starts Sunday 2024-06-09; today (Wed) is 3 days in (Sun..Wed = 4 days).
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [
        ...eventsOn("2024-06-09", "2024-06-12"), // this week
        ...eventsOn("2024-06-02", "2024-06-05"), // previous week, within same day-count window
        ...eventsOn("2024-06-08"), // previous week but outside the window (Saturday)
      ],
    });

    const result = await getStats("user1");

    expect(result.thisWeek.count).toBe(2);
    expect(result.thisWeek.previousCount).toBe(2);
  });

  it("computes this-month and previous-month counts over the same number of days into each month", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [
        ...eventsOn("2024-06-01", "2024-06-12"), // this month, days 1-12
        ...eventsOn("2024-05-01", "2024-05-12"), // previous month, days 1-12
        ...eventsOn("2024-05-20"), // previous month but outside the window
      ],
    });

    const result = await getStats("user1");

    expect(result.thisMonth.count).toBe(2);
    expect(result.thisMonth.previousCount).toBe(2);
  });

  it("computes a streak of consecutive days ending today", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: eventsOn("2024-06-10", "2024-06-11", "2024-06-12"),
    });

    const result = await getStats("user1");

    expect(result.streakDays).toBe(3);
  });

  it("keeps a streak alive when today has no plays yet but yesterday does", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: eventsOn("2024-06-10", "2024-06-11"),
    });

    const result = await getStats("user1");

    expect(result.streakDays).toBe(2);
  });

  it("resets the streak to 0 once a full day has passed with no plays", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: eventsOn("2024-06-09"),
    });

    const result = await getStats("user1");

    expect(result.streakDays).toBe(0);
  });

  it("buckets heatmap days into quartile-based levels", async () => {
    mockDataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId.mockResolvedValue({
      data: [
        ...eventsOn("2024-06-12"),
        ...eventsOn("2024-06-11", "2024-06-11"),
        ...eventsOn("2024-06-10", "2024-06-10", "2024-06-10"),
        ...eventsOn("2024-06-09", "2024-06-09", "2024-06-09", "2024-06-09"),
      ],
    });

    const result = await getStats("user1");
    const byDate = new Map(result.heatmap.map((day) => [day.date, day]));

    // Quartile thresholds computed from counts [1, 2, 3, 4] land at [2, 3, 4].
    expect(byDate.get("2024-06-12")?.level).toBe(1); // count 1 <= threshold 2
    expect(byDate.get("2024-06-11")?.level).toBe(1); // count 2 <= threshold 2
    expect(byDate.get("2024-06-10")?.level).toBe(2); // count 3 <= threshold 3
    expect(byDate.get("2024-06-09")?.level).toBe(3); // count 4 <= threshold 4
    expect(byDate.get("2024-01-01")?.level).toBe(0);
  });
});
