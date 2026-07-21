"use client";

import type { AlbumSearchResult } from "@/app/list/actions";
import { AddableAlbumList } from "@/app/list/AddableAlbumList";
import { EmptyState } from "@/design/atoms/EmptyState";

interface ArtistDiscographyProps {
  albums: AlbumSearchResult[];
}

export function ArtistDiscography({ albums }: Readonly<ArtistDiscographyProps>) {
  if (albums.length === 0) {
    return (
      <EmptyState
        title="No albums found"
        description="This artist doesn't have any albums on Spotify."
      />
    );
  }

  return <AddableAlbumList albums={albums} />;
}
