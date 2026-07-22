import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AddIconButton } from "./AddIconButton";

describe("AddIconButton", () => {
  it("renders a link with the given label and href", () => {
    render(<AddIconButton label="Add album" href="/list/album/1/add" />);

    const link = screen.getByRole("link", { name: "Add album" });
    expect(link).toHaveAttribute("href", "/list/album/1/add");
  });
});
