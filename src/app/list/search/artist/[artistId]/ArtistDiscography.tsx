"use client";

import { useState, useTransition } from "react";
import { addAlbum, type AlbumSearchResult } from "@/app/list/actions";
import { artistSearchHref } from "@/app/list/routes";
import { AlbumRow } from "@/design/molecules/AlbumRow";
import { Banner } from "@/design/atoms/Banner";
import { Button } from "@/design/atoms/Button";
import { EmptyState } from "@/design/atoms/EmptyState";
import { VStack } from "@/design/atoms/Stack";

interface ArtistDiscographyProps {
  albums: AlbumSearchResult[];
}

export function ArtistDiscography({ albums }: Readonly<ArtistDiscographyProps>) {
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isAdding, startAdding] = useTransition();

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
    </VStack>
  );
}
