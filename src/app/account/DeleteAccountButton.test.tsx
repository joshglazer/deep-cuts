import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// actions.ts imports @/auth, which doesn't resolve under Vitest (see
// CLAUDE.md) — stubbed rather than pulling that chain in.
const deleteAccount = vi.fn();
vi.mock("./actions", () => ({ deleteAccount }));

const { DeleteAccountButton } = await import("./DeleteAccountButton");

describe("DeleteAccountButton", () => {
  it("confirms and deletes the account", async () => {
    deleteAccount.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<DeleteAccountButton />);

    await user.click(screen.getByRole("button", { name: "Delete account" }));
    const dialog = screen.getByRole("alertdialog", { hidden: true });
    expect(within(dialog).getByText("Delete your account?")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Delete account" }));

    expect(deleteAccount).toHaveBeenCalled();
  });
});
