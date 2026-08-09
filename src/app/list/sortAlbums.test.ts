import { describe, expect, it } from "vitest";
import {
  ALBUM_SORT_OPTIONS,
  ARTIST_PAGE_ALBUM_SORT_OPTIONS,
  DEFAULT_ALBUM_SORT,
  parseAlbumSort,
  sortAlbums,
  type SortableAlbum,
} from "./sortAlbums";

function makeAlbum(overrides: Partial<SortableAlbum>): SortableAlbum {
  return {
    name: "Album",
    artistName: "Artist",
    addedAt: "2024-01-01T00:00:00.000Z",
    spotifyAlbumId: "id",
    ...overrides,
  };
}

describe("parseAlbumSort", () => {
  it("returns the matching sort for a known value", () => {
    expect(parseAlbumSort("artist")).toBe("artist");
  });

  it("falls back to the default sort for an unknown value", () => {
    expect(parseAlbumSort("bogus")).toBe(DEFAULT_ALBUM_SORT);
  });

  it("falls back to the default sort when no value is given", () => {
    expect(parseAlbumSort(undefined)).toBe(DEFAULT_ALBUM_SORT);
  });
});

describe("ARTIST_PAGE_ALBUM_SORT_OPTIONS", () => {
  it("excludes the artist-name sort", () => {
    expect(ARTIST_PAGE_ALBUM_SORT_OPTIONS.map((o) => o.value)).not.toContain("artist");
    expect(ARTIST_PAGE_ALBUM_SORT_OPTIONS.length).toBe(ALBUM_SORT_OPTIONS.length - 1);
  });
});

describe("sortAlbums", () => {
  const albums = [
    makeAlbum({ name: "Zeta", artistName: "Beta", addedAt: "2024-01-01", spotifyAlbumId: "a" }),
    makeAlbum({ name: "Alpha", artistName: "Alpha Artist", addedAt: "2024-03-01", spotifyAlbumId: "b" }),
    makeAlbum({ name: "Mid", artistName: "Zulu", addedAt: "2024-02-01", spotifyAlbumId: "c" }),
  ];

  it("sorts by recently-added, newest first", () => {
    const result = sortAlbums(albums, "recently-added");
    expect(result.map((a) => a.spotifyAlbumId)).toEqual(["b", "c", "a"]);
  });

  it("sorts by album name alphabetically, tie-broken by artist name", () => {
    const result = sortAlbums(albums, "album");
    expect(result.map((a) => a.name)).toEqual(["Alpha", "Mid", "Zeta"]);
  });

  it("sorts by artist name alphabetically, tie-broken by album name", () => {
    const result = sortAlbums(albums, "artist");
    expect(result.map((a) => a.artistName)).toEqual(["Alpha Artist", "Beta", "Zulu"]);
  });

  it("breaks artist name ties by album name", () => {
    const tied = [
      makeAlbum({ name: "B Album", artistName: "Same", spotifyAlbumId: "x" }),
      makeAlbum({ name: "A Album", artistName: "Same", spotifyAlbumId: "y" }),
    ];
    const result = sortAlbums(tied, "artist");
    expect(result.map((a) => a.spotifyAlbumId)).toEqual(["y", "x"]);
  });

  it("sorts recently-played albums by lastPlayedAt, most recent first", () => {
    const withPlays = [
      makeAlbum({ spotifyAlbumId: "a", addedAt: "2024-01-01", lastPlayedAt: "2024-05-01" }),
      makeAlbum({ spotifyAlbumId: "b", addedAt: "2024-03-01", lastPlayedAt: "2024-06-01" }),
      makeAlbum({ spotifyAlbumId: "c", addedAt: "2024-02-01" }),
    ];
    const result = sortAlbums(withPlays, "recently-played");
    // b played most recently, then a; c has never been played so sorts last.
    expect(result.map((a) => a.spotifyAlbumId)).toEqual(["b", "a", "c"]);
  });

  it("places unplayed albums after played ones, ordered by most recently added among themselves", () => {
    const withPlays = [
      makeAlbum({ spotifyAlbumId: "a", addedAt: "2024-01-01", lastPlayedAt: "2024-05-01" }),
      makeAlbum({ spotifyAlbumId: "b", addedAt: "2024-03-01" }),
      makeAlbum({ spotifyAlbumId: "c", addedAt: "2024-02-01" }),
    ];
    const result = sortAlbums(withPlays, "recently-played");
    // a has been played; b and c have not, so they fall back to addedAt desc
    // (b added 2024-03-01, c added 2024-02-01).
    expect(result.map((a) => a.spotifyAlbumId)).toEqual(["a", "b", "c"]);
  });

  it("orders entirely-unplayed albums by most recently added", () => {
    const result = sortAlbums(albums, "recently-played");
    expect(result.map((a) => a.spotifyAlbumId)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input array", () => {
    const original = [...albums];
    sortAlbums(albums, "album");
    expect(albums).toEqual(original);
  });
});
