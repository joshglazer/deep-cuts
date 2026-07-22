import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/list",
  useSearchParams: () => new URLSearchParams(),
}));

const { FilterPopover } = await import("./FilterPopover");

async function openPopover() {
  const user = userEvent.setup();
  render(
    <FilterPopover
      view="flat"
      sort="recently-played"
      showCompleted={false}
      hasCompletedAlbums
    />
  );
  await user.click(screen.getByRole("button", { name: "Filter" }));
  return user;
}

describe("FilterPopover", () => {
  it("shows the view toggle, sort select, and completed toggle when relevant", async () => {
    await openPopover();

    expect(screen.getByRole("radio", { name: "Albums", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Sort by", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Show completed", hidden: true })).toBeInTheDocument();
  });

  it("hides the sort select when grouped by artist", async () => {
    const user = userEvent.setup();
    render(
      <FilterPopover view="artist" sort="recently-played" showCompleted={false} hasCompletedAlbums />
    );
    await user.click(screen.getByRole("button", { name: "Filter" }));

    expect(screen.queryByRole("combobox", { name: "Sort by", hidden: true })).not.toBeInTheDocument();
  });

  it("hides the completed toggle when there are no completed albums", async () => {
    const user = userEvent.setup();
    render(
      <FilterPopover view="flat" sort="recently-played" showCompleted={false} hasCompletedAlbums={false} />
    );
    await user.click(screen.getByRole("button", { name: "Filter" }));

    expect(screen.queryByRole("switch", { hidden: true })).not.toBeInTheDocument();
  });

  it("hides the view toggle when view is undefined", async () => {
    const user = userEvent.setup();
    render(
      <FilterPopover sort="recently-played" showCompleted={false} hasCompletedAlbums={false} />
    );
    await user.click(screen.getByRole("button", { name: "Filter" }));

    expect(screen.queryByRole("radio", { hidden: true })).not.toBeInTheDocument();
  });
});
