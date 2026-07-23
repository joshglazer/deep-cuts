import { afterEach, describe, expect, it } from "vitest";
import { computeStats } from "./computeStats";

function eventsOn(...dateKeys: string[]) {
  return dateKeys.map((dateKey) => ({ playedAt: `${dateKey}T12:00:00.000Z` }));
}

// A Wednesday, so week/month math below has a predictable "days into" count.
const NOW = new Date("2024-06-12T10:00:00.000Z");

describe("computeStats", () => {
  it("returns zeroed stats when there are no listen events", () => {
    const result = computeStats([], NOW);

    expect(result.thisWeek).toEqual({ count: 0, previousCount: 0 });
    expect(result.thisMonth).toEqual({ count: 0, previousCount: 0 });
    expect(result.streakDays).toBe(0);
    expect(result.heatmap).toHaveLength(52 * 7);
    expect(result.heatmap.every((day) => day.count === 0 && day.level === 0)).toBe(true);
  });

  it("marks future heatmap days and counts today's plays", () => {
    const result = computeStats(eventsOn("2024-06-12"), NOW);

    const futureDay = result.heatmap.find((day) => day.date === "2024-06-13");
    expect(futureDay?.isFuture).toBe(true);
    expect(futureDay?.count).toBe(0);
    const today = result.heatmap.find((day) => day.date === "2024-06-12");
    expect(today?.isFuture).toBe(false);
    expect(today?.count).toBe(1);
  });

  it("computes this-week and previous-week counts over the same number of days into each week", () => {
    // Week starts Sunday 2024-06-09; today (Wed) is 3 days in (Sun..Wed = 4 days).
    const result = computeStats(
      [
        ...eventsOn("2024-06-09", "2024-06-12"), // this week
        ...eventsOn("2024-06-02", "2024-06-05"), // previous week, within same day-count window
        ...eventsOn("2024-06-08"), // previous week but outside the window (Saturday)
      ],
      NOW
    );

    expect(result.thisWeek.count).toBe(2);
    expect(result.thisWeek.previousCount).toBe(2);
  });

  it("computes this-month and previous-month counts over the same number of days into each month", () => {
    const result = computeStats(
      [
        ...eventsOn("2024-06-01", "2024-06-12"), // this month, days 1-12
        ...eventsOn("2024-05-01", "2024-05-12"), // previous month, days 1-12
        ...eventsOn("2024-05-20"), // previous month but outside the window
      ],
      NOW
    );

    expect(result.thisMonth.count).toBe(2);
    expect(result.thisMonth.previousCount).toBe(2);
  });

  it("computes a streak of consecutive days ending today", () => {
    const result = computeStats(eventsOn("2024-06-10", "2024-06-11", "2024-06-12"), NOW);

    expect(result.streakDays).toBe(3);
  });

  it("keeps a streak alive when today has no plays yet but yesterday does", () => {
    const result = computeStats(eventsOn("2024-06-10", "2024-06-11"), NOW);

    expect(result.streakDays).toBe(2);
  });

  it("resets the streak to 0 once a full day has passed with no plays", () => {
    const result = computeStats(eventsOn("2024-06-09"), NOW);

    expect(result.streakDays).toBe(0);
  });

  it("buckets heatmap days into quartile-based levels", () => {
    const result = computeStats(
      [
        ...eventsOn("2024-06-12"),
        ...eventsOn("2024-06-11", "2024-06-11"),
        ...eventsOn("2024-06-10", "2024-06-10", "2024-06-10"),
        ...eventsOn("2024-06-09", "2024-06-09", "2024-06-09", "2024-06-09"),
      ],
      NOW
    );
    const byDate = new Map(result.heatmap.map((day) => [day.date, day]));

    // Quartile thresholds computed from counts [1, 2, 3, 4] land at [2, 3, 4].
    expect(byDate.get("2024-06-12")?.level).toBe(1); // count 1 <= threshold 2
    expect(byDate.get("2024-06-11")?.level).toBe(1); // count 2 <= threshold 2
    expect(byDate.get("2024-06-10")?.level).toBe(2); // count 3 <= threshold 3
    expect(byDate.get("2024-06-09")?.level).toBe(3); // count 4 <= threshold 4
    expect(byDate.get("2024-01-01")?.level).toBe(0);
  });

  describe("timezone handling", () => {
    afterEach(() => {
      process.env.TZ = "UTC";
    });

    it("buckets a play into the visitor's local day, not UTC's", () => {
      // 2024-06-12T02:00:00Z is 2024-06-11 19:00 local in Los Angeles
      // (UTC-7 in June), so both "now" and the play should bucket into
      // 2024-06-11 locally even though they're 2024-06-12 in UTC.
      process.env.TZ = "America/Los_Angeles";
      const now = new Date("2024-06-12T02:00:00.000Z");

      const result = computeStats([{ playedAt: "2024-06-12T02:00:00.000Z" }], now);

      const localToday = result.heatmap.find((day) => day.date === "2024-06-11");
      const utcToday = result.heatmap.find((day) => day.date === "2024-06-12");
      expect(localToday?.count).toBe(1);
      expect(localToday?.isFuture).toBe(false);
      expect(utcToday?.isFuture).toBe(true);
    });
  });
});
