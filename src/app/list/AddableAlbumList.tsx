"use client";

import type { AlbumSearchResult } from "./actions";
import { artistSearchHref } from "./routes";
import { useAddAlbum } from "./useAddAlbum";
import { AlbumRow } from "@/design/molecules/AlbumRow";
import { Banner } from "@/design/atoms/Banner";
import { Button } from "@/design/atoms/Button";
import { VStack } from "@/design/atoms/Stack";

interface AddableAlbumListProps {
  albums: AlbumSearchResult[];
}

export function AddableAlbumList({ albums }: Readonly<AddableAlbumListProps>) {
  const { addedIds, isAdding, add, error, setError } = useAddAlbum();

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
                  onClick={() => add(album)}
                />
              }
            />
          );
        })}
      </VStack>
    </VStack>
  );
}
