import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Header is an async server component (calls `auth()`); it's covered by its
// own test, so it's stubbed here rather than rendered for real — client-side
// React (as used by RTL) can't render async components directly.
vi.mock("./Header", () => ({ Header: () => <header data-testid="header-stub" /> }));

const { PageShell } = await import("./PageShell");

describe("PageShell", () => {
  it("renders the page title, breadcrumbs, actions, and children", () => {
    render(
      <PageShell
        title="My List"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "My List" }]}
        actions={<button type="button">Action</button>}
      >
        <p>Body content</p>
      </PageShell>
    );

    expect(screen.getByTestId("header-stub")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "My List" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });
});
