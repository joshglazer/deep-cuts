import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ActivityHeatmap } from "./ActivityHeatmap";
import type { HeatmapDay } from "./statsData";

function day(date: string, count: number, level: HeatmapDay["level"], isFuture = false): HeatmapDay {
  return { date, count, level, isFuture };
}

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function week(startKey: string): HeatmapDay[] {
  return Array.from({ length: 7 }, (_, i) => day(addDays(startKey, i), 0, 0));
}

describe("ActivityHeatmap", () => {
  it("renders a titled cell per non-future day, with singular/plural song counts", () => {
    const days: HeatmapDay[] = [
      day("2024-05-26", 0, 0),
      day("2024-05-27", 1, 1),
      day("2024-05-28", 2, 2),
      day("2024-05-29", 0, 0),
      day("2024-05-30", 0, 0),
      day("2024-05-31", 0, 0),
      day("2024-06-01", 0, 0),
    ];
    const { container } = render(<ActivityHeatmap days={days} />);

    expect(
      container.querySelector('[title="0 songs streamed on May 26, 2024"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[title="1 song streamed on May 27, 2024"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[title="2 songs streamed on May 28, 2024"]')
    ).toBeInTheDocument();
  });

  it("skips future days rather than rendering a titled cell", () => {
    const days: HeatmapDay[] = [
      day("2024-05-26", 0, 0),
      day("2024-05-27", 0, 0),
      day("2024-05-28", 0, 0),
      day("2024-05-29", 0, 0),
      day("2024-05-30", 0, 0),
      day("2024-05-31", 0, 0),
      day("2024-06-01", 0, 0, true),
    ];
    const { container } = render(<ActivityHeatmap days={days} />);

    expect(container.querySelectorAll("[title]")).toHaveLength(6);
  });

  it("labels the first week of each new month, leaving repeats blank", () => {
    const days: HeatmapDay[] = [
      ...week("2024-04-07"), // Apr 7-13
      ...week("2024-04-14"), // Apr 14-20, same month as previous -> blank
      ...week("2024-04-28"), // Apr 28-May 4, week starts in April -> blank
      ...week("2024-05-05"), // May 5-11, new month -> "May"
    ];
    const { container } = render(<ActivityHeatmap days={days} />);
    const monthLabels = Array.from(container.querySelectorAll(".h-4")).map((el) =>
      el.textContent?.trim()
    );

    expect(monthLabels).toEqual(["Apr", "", "", "May"]);
  });
});
