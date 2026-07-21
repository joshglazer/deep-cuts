import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth }));

const { Footer } = await import("./Footer");

describe("Footer", () => {
  it("shows the delayed-activity note when signed in", async () => {
    auth.mockResolvedValue({ spotifyUserId: "user1" });

    render(await Footer());

    expect(screen.getByText(/Listening activity may be delayed/)).toBeInTheDocument();
  });

  it("hides the delayed-activity note when signed out", async () => {
    auth.mockResolvedValue(null);

    render(await Footer());

    expect(screen.queryByText(/Listening activity may be delayed/)).not.toBeInTheDocument();
  });

  it("always renders the project credit and source link", async () => {
    auth.mockResolvedValue(null);

    render(await Footer());

    expect(screen.getByRole("link", { name: "Josh Glazer" })).toHaveAttribute(
      "href",
      "https://joshglazer.com"
    );
    expect(screen.getByRole("link", { name: "Source Code" })).toHaveAttribute(
      "href",
      "https://github.com/joshglazer/deep-cuts"
    );
  });
});
