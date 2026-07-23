import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Header is an async server component and crashes when embedded as JSX under
// client-side React (see PageShell.test.tsx) — stubbed so the real PageShell
// still renders.
vi.mock("@/components/Header", () => ({ Header: () => <header data-testid="header-stub" /> }));

const { default: PrivacyPage } = await import("./page");

describe("PrivacyPage", () => {
  it("renders the page title and every section heading", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { name: "Privacy Policy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Information we collect" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How we use this information" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What we don’t do" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Where data is stored" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How long we keep data, and your choices" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Children’s privacy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contact" })).toBeInTheDocument();
  });

  it("links to the My Account page and Spotify's connected apps page for data deletion", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("link", { name: "My Account" })).toHaveAttribute("href", "/account");
    expect(screen.getByRole("link", { name: "connected apps page" })).toHaveAttribute(
      "href",
      "https://www.spotify.com/account/apps/"
    );
  });

  it("provides a mailto contact link", () => {
    render(<PrivacyPage />);

    const contactLinks = screen.getAllByRole("link", { name: "joshglazer@gmail.com" });
    expect(contactLinks.length).toBeGreaterThan(0);
    for (const link of contactLinks) {
      expect(link).toHaveAttribute("href", "mailto:joshglazer@gmail.com");
    }
  });
});
