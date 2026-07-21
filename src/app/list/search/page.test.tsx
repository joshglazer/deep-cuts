import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const requireSpotifyUserIdOrRedirect = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrRedirect }));

vi.mock("@/components/PageShell", () => ({
  PageShell: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));
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
