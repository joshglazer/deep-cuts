"use client";

import { useState, useTransition } from "react";
import { addAlbum, type AlbumSearchResult } from "./actions";

/**
 * Add-to-list state shared by the search page and the artist discography
 * page. `addedIds` starts from `initialAddedIds` (albums already on the
 * user's list, per the search/discography server actions) and grows
 * locally rather than re-reading from the server on each add, since
 * neither page re-fetches after an add — the row just switches to its
 * "Already added" state in place.
 */
export function useAddAlbum(initialAddedIds: string[] = []) {
  const [addedIds, setAddedIds] = useState<Set<string>>(() => new Set(initialAddedIds));
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
