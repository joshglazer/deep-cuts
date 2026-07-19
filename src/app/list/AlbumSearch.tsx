"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  search,
  addAlbum,
  type AlbumSearchResult,
  type ArtistSearchResult,
} from "./actions";
import { artistSearchHref } from "./routes";
import { AlbumRow } from "@/design/molecules/AlbumRow";
import { ArtistRow } from "@/design/molecules/ArtistRow";
import { Banner } from "@/design/atoms/Banner";
import { Button } from "@/design/atoms/Button";
import { SegmentedControl } from "@/design/atoms/SegmentedControl";
import { HStack, StackItem, VStack } from "@/design/atoms/Stack";
import { TextInput } from "@/design/atoms/TextInput";

export function AlbumSearch() {
  const [query, setQuery] = useState("");
  const [artists, setArtists] = useState<ArtistSearchResult[]>([]);
  const [albums, setAlbums] = useState<AlbumSearchResult[]>([]);
  const [view, setView] = useState<"artist" | "album">("album");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isAdding, startAdding] = useTransition();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startSearch(async () => {
      try {
        const result = await search(query);
        setArtists(result.artists);
        setAlbums(result.albums);
      } catch {
        setError("Couldn't search Spotify. Try again.");
      }
    });
  }

  function handleAdd(album: AlbumSearchResult) {
    startAdding(async () => {
      try {
        await addAlbum(album);
        setAddedIds((prev) => new Set(prev).add(album.spotifyAlbumId));
      } catch {
        setError("Couldn't add that album. Try again.");
      }
    });
  }

  return (
    <VStack gap="md" className="mb-10">
      <HStack gap="sm" vAlign="end">
        <StackItem size="fill">
          <form onSubmit={handleSearch}>
            <HStack gap="sm" vAlign="end">
              <StackItem size="fill">
                <TextInput
                  label="Search for an artist or album"
                  isLabelHidden
                  startIcon="search"
                  hasClear
                  placeholder="Search for an artist or album…"
                  value={query}
                  onChange={setQuery}
                />
              </StackItem>
              <Button
                type="submit"
                label="Search"
                isLoading={isSearching}
                isDisabled={!query.trim()}
              />
            </HStack>
          </form>
        </StackItem>

        {(artists.length > 0 || albums.length > 0) && (
          <SegmentedControl
            value={view}
            onChange={(value) => setView(value as "artist" | "album")}
            label="Search results view"
            options={[
              { value: "album", label: "Albums" },
              { value: "artist", label: "Artists" },
            ]}
          />
        )}
      </HStack>

      {error && (
        <Banner
          status="error"
          title={error}
          isDismissable
          onDismiss={() => setError(null)}
        />
      )}

      {view === "artist" && artists.length > 0 && (
        <VStack gap="sm">
          {artists.map((artist) => (
            <ArtistRow
              key={artist.spotifyArtistId}
              name={artist.name}
              imageUrl={artist.imageUrl}
              href={artistSearchHref(artist.spotifyArtistId)}
            />
          ))}
        </VStack>
      )}

      {view === "album" && albums.length > 0 && (
        <VStack gap="sm">
          {albums.map((album) => {
            const added = addedIds.has(album.spotifyAlbumId);
            return (
              <AlbumRow
                key={album.spotifyAlbumId}
                album={album}
                artistHref={artistSearchHref(album.spotifyArtistId)}
                endContent={
                  <Button
                    label={added ? "Added" : "Add"}
                    variant={added ? "secondary" : "primary"}
                    size="sm"
                    isDisabled={added || isAdding}
                    onClick={() => handleAdd(album)}
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
