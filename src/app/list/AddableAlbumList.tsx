"use client";

import type { AlbumSearchResult } from "./actions";
import { artistSearchHref } from "./routes";
import { AlbumRow } from "@/design/molecules/AlbumRow";
import { Button } from "@/design/atoms/Button";
import { VStack } from "@/design/atoms/Stack";

interface AddableAlbumListProps {
  albums: AlbumSearchResult[];
  addedIds: Set<string>;
  isAdding: boolean;
  onAdd: (album: AlbumSearchResult) => void;
}

export function AddableAlbumList({
  albums,
  addedIds,
  isAdding,
  onAdd,
}: Readonly<AddableAlbumListProps>) {
  return (
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
                onClick={() => onAdd(album)}
              />
            }
          />
        );
      })}
    </VStack>
  );
}
