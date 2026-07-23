import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const requireSpotifyUserIdOrRedirect = vi.fn();
const auth = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrRedirect, auth }));

// DeleteAccountButton (a real, rendered child) imports ./actions, which
// imports @/auth — mocked directly here rather than digging into
// dataClient, same reasoning as TrackResetButton.test.tsx.
const deleteAccount = vi.fn();
vi.mock("./actions", () => ({ deleteAccount }));

// Header is an async server component and crashes when embedded as JSX under
// client-side React (see PageShell.test.tsx) — stubbed so the real PageShell
// still renders.
vi.mock("@/components/Header", () => ({ Header: () => <header data-testid="header-stub" /> }));

const { default: AccountPage } = await import("./page");

describe("AccountPage", () => {
  it("redirects when there's no Spotify session", async () => {
    requireSpotifyUserIdOrRedirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    await expect(AccountPage()).rejects.toThrow("redirect");
  });

  it("shows the signed-in user's name and email from the Spotify session", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    auth.mockResolvedValue({
      user: { name: "Josh Glazer", email: "josh@example.com", image: null },
    });

    render(await AccountPage());

    expect(screen.getByText("Josh Glazer")).toBeInTheDocument();
    expect(screen.getByText("josh@example.com")).toBeInTheDocument();
  });

  it("falls back to a generic label when the session has no name, and hides email when absent", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    auth.mockResolvedValue({ user: {} });

    render(await AccountPage());

    expect(screen.getByText("Spotify user")).toBeInTheDocument();
  });

  it("renders the Danger Zone with the delete account control", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");
    auth.mockResolvedValue({ user: { name: "Josh Glazer" } });

    render(await AccountPage());

    expect(screen.getByRole("heading", { name: "Danger Zone" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete account" })).toBeInTheDocument();
  });
});
