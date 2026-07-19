import { AlbumRowActionMenu } from "./AlbumRowActionMenu";
import type { AlbumListenStats } from "./listenProgress";
import { albumHref, artistListHref, artistSearchHref } from "./routes";
import { AlbumRow } from "@/design/molecules/AlbumRow";
import { VStack } from "@/design/atoms/Stack";

interface ListedAlbum {
  id: string;
  name: string;
  artistName: string;
  imageUrl?: string | null;
  spotifyAlbumId: string;
  spotifyArtistId: string;
  totalTracks?: number | null;
  completedAt?: string | null;
}

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
          endContent={
            <AlbumRowActionMenu
              albumId={album.id}
              albumName={album.name}
              artistName={album.artistName}
              spotifyAlbumId={album.spotifyAlbumId}
              albumHref={albumHref(album.spotifyAlbumId)}
              artistHref={artistListHref(album.spotifyArtistId)}
              addMoreHref={artistSearchHref(album.spotifyArtistId)}
            />
          }
        />
      ))}
    </VStack>
  );
}
