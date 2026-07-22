import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders an SVG and forwards a className", () => {
    const { container } = render(<Logo className="h-9 w-9" />);
    const svg = container.querySelector("svg");

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("h-9", "w-9");
  });
});
