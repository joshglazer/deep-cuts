import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/list",
  useSearchParams: () => new URLSearchParams(),
}));

const { ViewToggle } = await import("./ViewToggle");

describe("ViewToggle", () => {
  it("marks the current view selected", () => {
    render(<ViewToggle view="artist" />);
    expect(screen.getByRole("radio", { name: "Artists" })).toBeChecked();
  });

  it("sets view=artist when switching to Artists", async () => {
    const user = userEvent.setup();
    render(<ViewToggle view="flat" />);

    await user.click(screen.getByRole("radio", { name: "Artists" }));

    expect(push).toHaveBeenCalledWith("/list?view=artist");
  });

  it("clears the view param when switching back to Albums", async () => {
    const user = userEvent.setup();
    render(<ViewToggle view="artist" />);

    await user.click(screen.getByRole("radio", { name: "Albums" }));

    expect(push).toHaveBeenCalledWith("/list");
  });
});
