import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterRow } from "./FilterRow";

describe("FilterRow", () => {
  it("renders the label and its children", () => {
    render(
      <FilterRow label="Sort by">
        <button type="button">control</button>
      </FilterRow>
    );

    expect(screen.getByText("Sort by")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "control" })).toBeInTheDocument();
  });
});
