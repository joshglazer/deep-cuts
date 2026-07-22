import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const auth = vi.fn();
const signIn = vi.fn();
let previewLoginEnabled = false;
vi.mock("@/auth", () => ({
  auth,
  signIn,
  get previewLoginEnabled() {
    return previewLoginEnabled;
  },
}));

const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect }));

const { default: Home } = await import("./page");

describe("Home", () => {
  it("redirects signed-in users to /list", async () => {
    auth.mockResolvedValue({ spotifyUserId: "user1" });

    await expect(Home()).rejects.toThrow("REDIRECT:/list");
  });

  it("shows the sign-in page for signed-out visitors", async () => {
    auth.mockResolvedValue(null);

    render(await Home());

    expect(screen.getByRole("button", { name: "Sign in with Spotify" })).toBeInTheDocument();
    expect(screen.getByText("Add anything to your list")).toBeInTheDocument();
  });

  it("hides the preview sign-in button by default", async () => {
    auth.mockResolvedValue(null);
    previewLoginEnabled = false;

    render(await Home());

    expect(screen.queryByRole("button", { name: /preview sign-in/i })).not.toBeInTheDocument();
  });

  it("shows the preview sign-in button when enabled", async () => {
    auth.mockResolvedValue(null);
    previewLoginEnabled = true;

    render(await Home());

    expect(screen.getByRole("button", { name: /preview sign-in/i })).toBeInTheDocument();
  });
});
