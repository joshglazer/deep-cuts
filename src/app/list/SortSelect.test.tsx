import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/list",
  useSearchParams: () => new URLSearchParams(),
}));

const { SortSelect } = await import("./SortSelect");

describe("SortSelect", () => {
  it("sets the sort param when a non-default option is chosen", async () => {
    const user = userEvent.setup();
    render(<SortSelect sort="recently-played" />);

    await user.click(screen.getByRole("combobox", { name: "Sort by" }));
    await user.click(screen.getByRole("option", { hidden: true, name: "Artist name" }));

    expect(push).toHaveBeenCalledWith("/list?sort=artist");
  });

  it("clears the sort param when the default option is chosen", async () => {
    const user = userEvent.setup();
    render(<SortSelect sort="artist" />);

    await user.click(screen.getByRole("combobox", { name: "Sort by" }));
    await user.click(screen.getByRole("option", { hidden: true, name: "Recently played" }));

    expect(push).toHaveBeenCalledWith("/list");
  });

  it("uses the given options list instead of the default", async () => {
    const user = userEvent.setup();
    render(
      <SortSelect
        sort="recently-played"
        options={[{ value: "recently-played", label: "Recently played" }]}
      />
    );

    await user.click(screen.getByRole("combobox", { name: "Sort by" }));

    expect(screen.getByRole("option", { hidden: true, name: "Recently played" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { hidden: true, name: "Artist name" })).not.toBeInTheDocument();
  });
});
