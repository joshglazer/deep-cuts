import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DesignProvider } from "./DesignProvider";

describe("DesignProvider", () => {
  it("renders its children", () => {
    render(
      <DesignProvider>
        <p>content</p>
      </DesignProvider>
    );

    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
