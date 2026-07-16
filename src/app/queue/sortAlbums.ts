import type { AlbumListenStats } from "./listenProgress";

export type AlbumSort = "recently-played" | "recently-added" | "artist" | "album";

export const DEFAULT_ALBUM_SORT: AlbumSort = "recently-played";

export const ALBUM_SORT_OPTIONS: { value: AlbumSort; label: string }[] = [
  { value: "recently-played", label: "Recently played" },
  { value: "recently-added", label: "Recently added" },
  { value: "artist", label: "Artist name" },
  { value: "album", label: "Album name" },
];

export function parseAlbumSort(value?: string): AlbumSort {
  return ALBUM_SORT_OPTIONS.some((option) => option.value === value)
    ? (value as AlbumSort)
    : DEFAULT_ALBUM_SORT;
}

interface SortableAlbum {
  name: string;
  artistName: string;
  queuedAt: string;
  spotifyAlbumId: string;
}

export function sortAlbums<T extends SortableAlbum>(
  albums: T[],
  sort: AlbumSort,
  listenStatsByAlbum: Map<string, AlbumListenStats>
): T[] {
  const sorted = albums.slice();
  switch (sort) {
    case "recently-added":
      sorted.sort((a, b) => b.queuedAt.localeCompare(a.queuedAt));
      break;
    case "recently-played":
      sorted.sort((a, b) => {
        const aPlayedAt = listenStatsByAlbum.get(a.spotifyAlbumId)?.lastPlayedAt;
        const bPlayedAt = listenStatsByAlbum.get(b.spotifyAlbumId)?.lastPlayedAt;
        // Albums with no listen history yet sort after ones that have been
        // played, ordered among themselves by most recently queued.
        if (aPlayedAt && bPlayedAt) return bPlayedAt.localeCompare(aPlayedAt);
        if (aPlayedAt) return -1;
        if (bPlayedAt) return 1;
        return b.queuedAt.localeCompare(a.queuedAt);
      });
      break;
    case "album":
      sorted.sort(
        (a, b) => a.name.localeCompare(b.name) || a.artistName.localeCompare(b.artistName)
      );
      break;
    case "artist":
    default:
      sorted.sort(
        (a, b) => a.artistName.localeCompare(b.artistName) || a.name.localeCompare(b.name)
      );
      break;
  }
  return sorted;
}
