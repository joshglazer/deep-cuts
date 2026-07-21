import { describe, expect, it } from "vitest";
import { albumHref, artistListHref, artistSearchHref } from "./routes";

describe("routes", () => {
  it("builds an album detail href", () => {
    expect(albumHref("abc123")).toBe("/list/album/abc123");
  });

  it("builds an artist list href", () => {
    expect(artistListHref("artist1")).toBe("/list/artist/artist1");
  });

  it("builds an artist search href", () => {
    expect(artistSearchHref("artist1")).toBe("/list/search/artist/artist1");
  });
});
