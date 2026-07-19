import type { Schema } from "../../../amplify/data/resource";
import { AlbumRowActionMenu } from "./AlbumRowActionMenu";
import type { AlbumListenStats } from "./listenProgress";
import { albumHref, artistListHref } from "./routes";
import { AlbumRow } from "@/design/molecules/AlbumRow";
import { VStack } from "@/design/atoms/Stack";

/**
 * Derived from the generated model rather than restated by hand, so renaming
 * a field in amplify/data/resource.ts fails the build here instead of
 * silently degrading — the optional-field version of this type still accepted
 * rows that had lost a field, so a rename rendered every album as incomplete.
 */
type ListedAlbum = Pick<
  Schema["Album"]["type"],
  | "id"
  | "name"
  | "artistName"
  | "imageUrl"
  | "spotifyAlbumId"
  | "spotifyArtistId"
  | "totalTracks"
  | "completedAt"
>;

interface AlbumListProps {
  albums: ListedAlbum[];
  listenStatsByAlbum: Map<string, AlbumListenStats>;
}

export function AlbumList({ albums, listenStatsByAlbum }: Readonly<AlbumListProps>) {
  return (
    <VStack gap="sm">
      {albums.map((album) => (
        <AlbumRow
          key={album.id}
          album={album}
          artistHref={artistListHref(album.spotifyArtistId)}
          href={albumHref(album.spotifyAlbumId)}
          progress={
            album.totalTracks != null
              ? {
                  played: listenStatsByAlbum.get(album.spotifyAlbumId)?.playedTrackIds.size ?? 0,
                  total: album.totalTracks,
                }
              : undefined
          }
          completedAt={album.completedAt}
          endContent={<AlbumRowActionMenu album={album} />}
        />
      ))}
    </VStack>
  );
}
