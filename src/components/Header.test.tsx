import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const auth = vi.fn();
const signOut = vi.fn();
vi.mock("@/auth", () => ({ auth, signOut }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/list",
  useRouter: () => ({ push: vi.fn() }),
}));

const { Header } = await import("./Header");

describe("Header", () => {
  it("renders the wordmark, nav links, and user menu with the session's name", async () => {
    auth.mockResolvedValue({ user: { name: "Josh", image: null } });

    render(await Header());

    expect(screen.getAllByText("Deep Cuts").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "My List" })).toHaveAttribute("href", "/list");
    expect(screen.getByRole("link", { name: "Activity" })).toHaveAttribute("href", "/activity");
    expect(screen.getByRole("link", { name: "Add to List" })).toHaveAttribute(
      "href",
      "/list/search"
    );
    expect(screen.getByRole("button", { name: "Josh" })).toBeInTheDocument();
  });

  it("falls back to 'Account' in the user menu when signed out", async () => {
    auth.mockResolvedValue(null);

    render(await Header());

    expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
  });
});
