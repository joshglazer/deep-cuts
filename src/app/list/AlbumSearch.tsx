"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  search,
  type AlbumSearchResult,
  type ArtistSearchResult,
} from "./actions";
import { AddableAlbumList } from "./AddableAlbumList";
import { IncludeSinglesToggle } from "./IncludeSinglesToggle";
import { artistSearchHref } from "./routes";
import { ArtistRow } from "@/design/molecules/ArtistRow";
import { Banner } from "@/design/atoms/Banner";
import { Button } from "@/design/atoms/Button";
import { EmptyState } from "@/design/atoms/EmptyState";
import { SegmentedControl } from "@/design/atoms/SegmentedControl";
import { HStack, StackItem, VStack } from "@/design/atoms/Stack";
import { TextInput } from "@/design/atoms/TextInput";

export function AlbumSearch() {
  const [query, setQuery] = useState("");
  const [artists, setArtists] = useState<ArtistSearchResult[]>([]);
  const [albums, setAlbums] = useState<AlbumSearchResult[]>([]);
  const [view, setView] = useState<"artist" | "album">("album");
  const [includeSingles, setIncludeSingles] = useState(false);
  const [isSearching, startSearch] = useTransition();
  const [searchError, setSearchError] = useState<string | null>(null);

  const visibleAlbums = includeSingles
    ? albums
    : albums.filter((album) => album.albumType === "album");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearchError(null);
    startSearch(async () => {
      try {
        const result = await search(query);
        setArtists(result.artists);
        setAlbums(result.albums);
      } catch {
        setSearchError("Couldn't search Spotify. Try again.");
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

      {searchError && (
        <Banner
          status="error"
          title={searchError}
          isDismissable
          onDismiss={() => setSearchError(null)}
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
          <IncludeSinglesToggle value={includeSingles} onChange={setIncludeSingles} />
          {visibleAlbums.length > 0 ? (
            <AddableAlbumList albums={visibleAlbums} />
          ) : (
            <EmptyState
              title="No full albums found"
              description="Turn on “Include singles & other releases” to see them."
            />
          )}
        </VStack>
      )}
    </VStack>
  );
}
