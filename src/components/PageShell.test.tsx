import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Header is an async server component (calls `auth()`), rendered here as
// <Header /> JSX rather than invoked+awaited directly (that's how
// Header.test.tsx covers it for real) — client-side React can't execute an
// async component embedded that way and aborts the *entire* render, not
// just Header's subtree (verified: an unmocked PageShell render here
// produces nothing, not even PageShell's own title). Stubbed rather than
// left broken; Header keeps its own real-rendering coverage in Header.test.tsx.
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
