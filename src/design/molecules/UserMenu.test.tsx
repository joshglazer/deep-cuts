import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const { UserMenu } = await import("./UserMenu");

describe("UserMenu", () => {
  it("shows the user's name as the trigger label and falls back to 'Account'", () => {
    const { rerender } = render(<UserMenu name="Josh" onSignOut={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Josh" })).toBeInTheDocument();

    rerender(<UserMenu onSignOut={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
  });

  it("navigates to /stats when the Stats item is clicked", async () => {
    const user = userEvent.setup();
    render(<UserMenu name="Josh" onSignOut={vi.fn()} />);

    await user.hover(screen.getByRole("button", { name: "Josh" }));
    await user.click(screen.getByRole("menuitem", { name: "Stats", hidden: true }));

    expect(push).toHaveBeenCalledWith("/stats");
  });

  it("navigates to /account when the My Account item is clicked", async () => {
    const user = userEvent.setup();
    render(<UserMenu name="Josh" onSignOut={vi.fn()} />);

    await user.hover(screen.getByRole("button", { name: "Josh" }));
    await user.click(screen.getByRole("menuitem", { name: "My Account", hidden: true }));

    expect(push).toHaveBeenCalledWith("/account");
  });

  it("calls onSignOut when the Sign out item is clicked", async () => {
    const onSignOut = vi.fn();
    const user = userEvent.setup();
    render(<UserMenu name="Josh" onSignOut={onSignOut} />);

    await user.hover(screen.getByRole("button", { name: "Josh" }));
    await user.click(screen.getByRole("menuitem", { name: "Sign out", hidden: true }));

    expect(onSignOut).toHaveBeenCalled();
  });
});
