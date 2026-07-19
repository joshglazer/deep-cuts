"use client";

import { useState, useTransition } from "react";
import { addAlbum, type AlbumSearchResult } from "./actions";

/**
 * Add-to-list state shared by the search page and the artist discography
 * page. `addedIds` is local rather than re-read from the server because
 * neither page re-fetches after an add — the row just switches to its
 * "Added" state in place.
 */
export function useAddAlbum() {
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isAdding, startAdding] = useTransition();

  function add(album: AlbumSearchResult) {
    startAdding(async () => {
      try {
        await addAlbum(album);
        setAddedIds((prev) => new Set(prev).add(album.spotifyAlbumId));
      } catch {
        setError("Couldn't add that album. Try again.");
      }
    });
  }

  return { addedIds, isAdding, add, error, setError };
}
