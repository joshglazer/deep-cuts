import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HStack, VStack } from "./Stack";

describe("HStack", () => {
  it.each([
    ["sm", "2"],
    ["md", "4"],
    ["lg", "6"],
  ] as const)("maps gap=%s to the spacing-scale step %s", (gap, step) => {
    render(
      <HStack gap={gap} data-testid="stack">
        content
      </HStack>
    );
    expect(screen.getByTestId("stack")).toHaveAttribute("data-gap", step);
  });

  it("passes through no gap when unset", () => {
    render(<HStack data-testid="stack">content</HStack>);
    expect(screen.getByTestId("stack")).not.toHaveAttribute("data-gap");
  });
});

describe("VStack", () => {
  it("maps gap=lg to the spacing-scale step 6", () => {
    render(
      <VStack gap="lg" data-testid="stack">
        content
      </VStack>
    );
    expect(screen.getByTestId("stack")).toHaveAttribute("data-gap", "6");
  });
});
