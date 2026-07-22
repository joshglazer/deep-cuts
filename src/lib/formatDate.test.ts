import { describe, expect, it } from "vitest";
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("formats an ISO date as a long US-style date", () => {
    expect(formatDate("2024-03-05T00:00:00.000Z")).toBe("March 5, 2024");
  });

  it("formats an ISO datetime with a time component", () => {
    expect(formatDate("2023-12-31T23:59:59.000Z")).toBe("December 31, 2023");
  });
});
