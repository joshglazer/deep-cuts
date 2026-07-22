import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedControl } from "./SegmentedControl";

describe("SegmentedControl", () => {
  it("renders an option per item and marks the selected value", () => {
    render(
      <SegmentedControl
        label="View"
        value="list"
        onChange={vi.fn()}
        options={[
          { value: "list", label: "List" },
          { value: "grid", label: "Grid" },
        ]}
      />
    );

    expect(screen.getByRole("radio", { name: "List" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Grid" })).not.toBeChecked();
  });

  it("calls onChange with the clicked option's value", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SegmentedControl
        label="View"
        value="list"
        onChange={onChange}
        options={[
          { value: "list", label: "List" },
          { value: "grid", label: "Grid" },
        ]}
      />
    );

    await user.click(screen.getByRole("radio", { name: "Grid" }));

    expect(onChange).toHaveBeenCalledWith("grid");
  });
});
