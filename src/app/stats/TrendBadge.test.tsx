import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrendBadge } from "./TrendBadge";

describe("TrendBadge", () => {
  it("renders nothing when there was no activity in either period", () => {
    const { container } = render(<TrendBadge trend={{ count: 0, previousCount: 0 }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows 'New activity' when the previous period had none", () => {
    render(<TrendBadge trend={{ count: 5, previousCount: 0 }} />);
    expect(screen.getByText("New activity")).toBeInTheDocument();
  });

  it("shows 'No change' when the percent change rounds to zero", () => {
    render(<TrendBadge trend={{ count: 100, previousCount: 100 }} />);
    expect(screen.getByText("No change")).toBeInTheDocument();
  });

  it("shows a positive percent change with a plus sign", () => {
    render(<TrendBadge trend={{ count: 150, previousCount: 100 }} />);
    expect(screen.getByText("+50% vs last period")).toBeInTheDocument();
  });

  it("shows a negative percent change without a plus sign", () => {
    render(<TrendBadge trend={{ count: 50, previousCount: 100 }} />);
    expect(screen.getByText("-50% vs last period")).toBeInTheDocument();
  });
});
