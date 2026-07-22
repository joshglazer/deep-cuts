import { describe, expect, it } from "vitest";
import { spotifyAlbumUri } from "./spotifyLinks";

describe("spotifyAlbumUri", () => {
  it("builds a spotify: deep link from an album id", () => {
    expect(spotifyAlbumUri("4aawyAB9vmqN3uQ7FjRGTy")).toBe("spotify:album:4aawyAB9vmqN3uQ7FjRGTy");
  });
});
