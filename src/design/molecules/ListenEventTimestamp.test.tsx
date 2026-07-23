import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListenEventTimestamp } from "./ListenEventTimestamp";

describe("ListenEventTimestamp", () => {
  it("shows the played date and time once mounted", async () => {
    render(<ListenEventTimestamp playedAt="2024-03-05T14:30:00.000Z" />);

    expect(await screen.findByText("March 5, 2024")).toBeInTheDocument();
    expect(screen.getByText("2:30 PM")).toBeInTheDocument();
  });
});
