"use client";

import { useState, useTransition, type FormEvent } from "react";
import { searchAlbums, queueAlbum, type AlbumSearchResult } from "./actions";
import { AlbumRow } from "@/design/molecules/AlbumRow";
import { Banner } from "@/design/atoms/Banner";
import { Button } from "@/design/atoms/Button";
import { HStack, VStack } from "@/design/atoms/Stack";
import { TextInput } from "@/design/atoms/TextInput";

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
    <VStack gap="md" className="mb-10">
      <form onSubmit={handleSearch}>
        <HStack gap="sm" vAlign="end">
          <TextInput
            label="Search for an album"
            isLabelHidden
            startIcon="search"
            hasClear
            placeholder="Search for an album…"
            value={query}
            onChange={setQuery}
          />
          <Button
            type="submit"
            label="Search"
            isLoading={isSearching}
            isDisabled={!query.trim()}
          />
        </HStack>
      </form>

      {error && (
        <Banner
          status="error"
          title={error}
          isDismissable
          onDismiss={() => setError(null)}
        />
      )}

      {results.length > 0 && (
        <VStack gap="sm">
          {results.map((album) => {
            const queued = queuedIds.has(album.spotifyAlbumId);
            return (
              <AlbumRow
                key={album.spotifyAlbumId}
                name={album.name}
                artistName={album.artistName}
                imageUrl={album.imageUrl}
                endContent={
                  <Button
                    label={queued ? "Queued" : "Queue"}
                    variant={queued ? "secondary" : "primary"}
                    size="sm"
                    isDisabled={queued || isQueuing}
                    onClick={() => handleQueue(album)}
                  />
                }
              />
            );
          })}
        </VStack>
      )}
    </VStack>
  );
}
