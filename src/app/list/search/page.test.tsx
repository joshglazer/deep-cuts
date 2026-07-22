import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const requireSpotifyUserIdOrRedirect = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrRedirect }));

// Header is an async server component and crashes when embedded as JSX under
// client-side React (see PageShell.test.tsx) — stubbed so the real PageShell
// still renders.
vi.mock("@/components/Header", () => ({ Header: () => <header data-testid="header-stub" /> }));
vi.mock("../AlbumSearch", () => ({
  AlbumSearch: () => <div data-testid="album-search" />,
}));

const { default: ListSearchPage } = await import("./page");

describe("ListSearchPage", () => {
  it("requires a signed-in session and renders the search UI", async () => {
    requireSpotifyUserIdOrRedirect.mockResolvedValue("user1");

    render(await ListSearchPage());

    expect(requireSpotifyUserIdOrRedirect).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Add to List" })).toBeInTheDocument();
    expect(screen.getByTestId("album-search")).toBeInTheDocument();
  });
});
