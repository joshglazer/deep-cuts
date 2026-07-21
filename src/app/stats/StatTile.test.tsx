import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatTile } from "./StatTile";

describe("StatTile", () => {
  it("renders the label and a locale-formatted value", () => {
    render(<StatTile label="Total streams" value={1234} />);

    expect(screen.getByText("Total streams")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("omits the trend badge when no trend is given", () => {
    render(<StatTile label="Total streams" value={5} />);
    expect(screen.queryByText(/vs last period/)).not.toBeInTheDocument();
  });

  it("renders a trend badge when a trend is given", () => {
    render(<StatTile label="This week" value={10} trend={{ count: 10, previousCount: 5 }} />);
    expect(screen.getByText("+100% vs last period")).toBeInTheDocument();
  });
});
