import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

const { HeaderMobileMenu } = await import("./HeaderMobileMenu");

describe("HeaderMobileMenu", () => {
  it("opens the nav menu and shows the brand and nav links", async () => {
    usePathname.mockReturnValue("/list");
    const user = userEvent.setup();
    render(<HeaderMobileMenu brand={<span data-testid="brand">Deep Cuts</span>} />);

    await user.click(screen.getByRole("button", { name: "Open navigation" }));

    expect(screen.getByTestId("brand")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My List" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Activity" })).toHaveAttribute("href", "/activity");
    expect(screen.getByRole("link", { name: "Add to List" })).toHaveAttribute("href", "/list/search");
    expect(screen.getByRole("link", { name: "Stats" })).toHaveAttribute("href", "/stats");
  });

  it("marks the search link selected on any /list/search subpath", async () => {
    usePathname.mockReturnValue("/list/search/artist/1");
    const user = userEvent.setup();
    render(<HeaderMobileMenu brand={<span>Deep Cuts</span>} />);

    await user.click(screen.getByRole("button", { name: "Open navigation" }));

    expect(screen.getByRole("link", { name: "Add to List" })).toHaveAttribute("aria-current", "page");
  });
});
