import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/list",
  useSearchParams: () => new URLSearchParams(),
}));

const { CompletedToggle } = await import("./CompletedToggle");

describe("CompletedToggle", () => {
  it("reflects the current showCompleted state", () => {
    render(<CompletedToggle showCompleted />);
    expect(screen.getByRole("switch", { name: "Show completed" })).toBeChecked();
  });

  it("sets completed=show when turned on", async () => {
    const user = userEvent.setup();
    render(<CompletedToggle showCompleted={false} />);

    await user.click(screen.getByRole("switch", { name: "Show completed" }));

    expect(push).toHaveBeenCalledWith("/list?completed=show");
  });

  it("clears the completed param when turned off", async () => {
    const user = userEvent.setup();
    render(<CompletedToggle showCompleted />);

    await user.click(screen.getByRole("switch", { name: "Show completed" }));

    expect(push).toHaveBeenCalledWith("/list");
  });
});
