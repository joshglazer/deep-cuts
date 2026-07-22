import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureHighlight } from "./FeatureHighlight";

describe("FeatureHighlight", () => {
  it("renders the icon, title, and description", () => {
    render(
      <FeatureHighlight
        icon={<span data-testid="icon">★</span>}
        title="Track your list"
        description="Add albums and see your progress."
      />
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Track your list" })).toBeInTheDocument();
    expect(screen.getByText("Add albums and see your progress.")).toBeInTheDocument();
  });
});
