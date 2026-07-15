"use client";

import { useState, useTransition } from "react";
import { queueAlbum, type AlbumSearchResult } from "@/app/queue/actions";
import { AlbumRow } from "@/design/molecules/AlbumRow";
import { Banner } from "@/design/atoms/Banner";
import { Button } from "@/design/atoms/Button";
import { EmptyState } from "@/design/atoms/EmptyState";
import { VStack } from "@/design/atoms/Stack";

export function ArtistDiscography({ albums }: { albums: AlbumSearchResult[] }) {
  const [queuedIds, setQueuedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isQueuing, startQueuing] = useTransition();

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
          const queued = queuedIds.has(album.spotifyAlbumId);
          return (
            <AlbumRow
              key={album.spotifyAlbumId}
              name={album.name}
              artistName={album.artistName}
              imageUrl={album.imageUrl}
              releaseYear={album.releaseYear}
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
    </VStack>
  );
}
