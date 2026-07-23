import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { StatsView } from "./StatsView";

beforeEach(() => {
  vi.setSystemTime(new Date("2024-06-12T10:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("StatsView", () => {
  it("renders nothing on the server, before the visitor's timezone is known", () => {
    expect(
      renderToStaticMarkup(<StatsView events={[{ playedAt: "2024-06-12T12:00:00.000Z" }]} />)
    ).toBe("");
  });

  it("computes and renders stats once mounted", async () => {
    render(
      <StatsView
        events={[
          { playedAt: "2024-05-15T12:00:00.000Z" }, // previous month, outside the trend window
          { playedAt: "2024-06-01T12:00:00.000Z" },
          { playedAt: "2024-06-05T12:00:00.000Z" },
          { playedAt: "2024-06-09T12:00:00.000Z" },
          { playedAt: "2024-06-12T12:00:00.000Z" }, // today
        ]}
      />
    );

    expect(await screen.findByText("Total songs streamed")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // total songs streamed
    expect(screen.getByText("Day streak")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // streak: only today is consecutive
    expect(screen.getByText("Listening activity")).toBeInTheDocument();
  });
});
