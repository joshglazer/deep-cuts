"use client";

import { useState } from "react";
import type { AlbumSearchResult } from "@/app/list/actions";
import { AddableAlbumList } from "@/app/list/AddableAlbumList";
import { IncludeSinglesToggle } from "@/app/list/IncludeSinglesToggle";
import { EmptyState } from "@/design/atoms/EmptyState";
import { VStack } from "@/design/atoms/Stack";

interface ArtistDiscographyProps {
  albums: AlbumSearchResult[];
}

export function ArtistDiscography({ albums }: Readonly<ArtistDiscographyProps>) {
  const [includeSingles, setIncludeSingles] = useState(false);

  if (albums.length === 0) {
    return (
      <EmptyState
        title="No albums found"
        description="This artist doesn't have any albums on Spotify."
      />
    );
  }

  const visibleAlbums = includeSingles
    ? albums
    : albums.filter((album) => album.albumType === "album");

  return (
    <VStack gap="md">
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
  );
}
