"use client";

import type { AlbumSearchResult } from "@/app/list/actions";
import { AddableAlbumList } from "@/app/list/AddableAlbumList";
import { useAddAlbum } from "@/app/list/useAddAlbum";
import { Banner } from "@/design/atoms/Banner";
import { EmptyState } from "@/design/atoms/EmptyState";
import { VStack } from "@/design/atoms/Stack";

interface ArtistDiscographyProps {
  albums: AlbumSearchResult[];
}

export function ArtistDiscography({ albums }: Readonly<ArtistDiscographyProps>) {
  const { addedIds, isAdding, add, error, setError } = useAddAlbum();

  if (albums.length === 0) {
    return (
      <EmptyState
        title="No albums found"
        description="This artist doesn't have any albums on Spotify."
      />
    );
  }

  return (
    <VStack gap="md">
      {error && (
        <Banner
          status="error"
          title={error}
          isDismissable
          onDismiss={() => setError(null)}
        />
      )}

      <AddableAlbumList
        albums={albums}
        addedIds={addedIds}
        isAdding={isAdding}
        onAdd={add}
      />
    </VStack>
  );
}
