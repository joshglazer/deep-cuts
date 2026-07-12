"use client";

import { useState, useTransition, type FormEvent } from "react";
import { searchAlbums, queueAlbum, type AlbumSearchResult } from "./actions";

export function AlbumSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlbumSearchResult[]>([]);
  const [queuedIds, setQueuedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isQueuing, startQueuing] = useTransition();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startSearch(async () => {
      try {
        setResults(await searchAlbums(query));
      } catch {
        setError("Couldn't search Spotify. Try again.");
      }
    });
  }

  function handleQueue(album: AlbumSearchResult) {
    startQueuing(async () => {
      try {
        await queueAlbum(album);
        setQueuedIds((prev) => new Set(prev).add(album.spotifyAlbumId));
      } catch {
        setError("Couldn't add that album. Try again.");
      }
    });
  }

  return (
    <div className="mb-10">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an album…"
          className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-spotify-green dark:border-zinc-700"
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="shrink-0 rounded-md bg-spotify-green px-4 py-2 text-sm font-medium text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {isSearching ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {results.length > 0 && (
        <ul className="mt-4 space-y-2">
          {results.map((album) => {
            const queued = queuedIds.has(album.spotifyAlbumId);
            return (
              <li
                key={album.spotifyAlbumId}
                className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {album.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.imageUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded object-cover"
                    />
                  )}
                  <span className="truncate text-sm">
                    {album.name} — {album.artistName}
                  </span>
                </div>
                <button
                  onClick={() => handleQueue(album)}
                  disabled={queued || isQueuing}
                  className={
                    queued
                      ? "shrink-0 rounded-md border border-spotify-green px-3 py-1 text-xs text-spotify-green disabled:opacity-50"
                      : "shrink-0 rounded-md border border-zinc-300 px-3 py-1 text-xs hover:border-spotify-green hover:text-spotify-green disabled:opacity-50 dark:border-zinc-700"
                  }
                >
                  {queued ? "Queued" : "Queue"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
