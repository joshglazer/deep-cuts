import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders the title", () => {
    render(<PageHeader title="My List" />);

    expect(screen.getByRole("heading", { name: "My List" })).toBeInTheDocument();
  });

  it("omits breadcrumbs when none are given", () => {
    render(<PageHeader title="My List" />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("renders breadcrumbs when given", () => {
    render(
      <PageHeader
        title="OK Computer"
        breadcrumbs={[
          { label: "My List", href: "/list" },
          { label: "OK Computer" },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: "My List" })).toHaveAttribute("href", "/list");
  });

  it("renders titleActions and actions", () => {
    render(
      <PageHeader
        title="My List"
        titleActions={<span data-testid="title-actions" />}
        actions={<span data-testid="actions" />}
      />
    );

    expect(screen.getByTestId("title-actions")).toBeInTheDocument();
    expect(screen.getByTestId("actions")).toBeInTheDocument();
  });
});
