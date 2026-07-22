import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Wordmark } from "./Wordmark";

describe("Wordmark", () => {
  it("renders as plain text when no href is given", () => {
    render(<Wordmark />);

    expect(screen.getByText("Deep Cuts")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders as a link when href is given", () => {
    render(<Wordmark href="/list" />);

    expect(screen.getByRole("link", { name: "Deep Cuts" })).toHaveAttribute("href", "/list");
  });
});
