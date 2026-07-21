import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageBreadcrumbs } from "./PageBreadcrumbs";

describe("PageBreadcrumbs", () => {
  it("renders each crumb and links every item except the last", () => {
    render(
      <PageBreadcrumbs
        items={[
          { label: "My List", href: "/list" },
          { label: "Radiohead", href: "/list/artist/1" },
          { label: "OK Computer" },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: "My List" })).toHaveAttribute("href", "/list");
    expect(screen.getByRole("link", { name: "Radiohead" })).toHaveAttribute(
      "href",
      "/list/artist/1"
    );
    expect(screen.getByText("OK Computer")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "OK Computer" })).not.toBeInTheDocument();
  });
});
