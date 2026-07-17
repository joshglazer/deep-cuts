import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dataClient } from "@/lib/amplify-server";
import { PageShell } from "@/components/PageShell";
import { removeAlbum } from "@/app/queue/actions";
import { getListenStatsByAlbum } from "@/app/queue/listenProgress";
import {
  ARTIST_PAGE_ALBUM_SORT_OPTIONS,
  parseAlbumSort,
  sortAlbums,
} from "@/app/queue/sortAlbums";
import { SortSelect } from "@/app/queue/SortSelect";
import { AddIconButton } from "@/design/molecules/AddIconButton";
import { AlbumRow } from "@/design/molecules/AlbumRow";
import { Button } from "@/design/atoms/Button";
import { EmptyState } from "@/design/atoms/EmptyState";
import { VStack } from "@/design/atoms/Stack";

export default async function ArtistQueuePage({
  params,
  searchParams,
}: {
  params: Promise<{ artistId: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const session = await auth();
  if (!session?.spotifyUserId) {
    redirect("/");
  }

  const { artistId } = await params;
  const { sort: sortParam } = await searchParams;
  const sort = parseAlbumSort(sortParam);

  const [{ data: albums }, listenStatsByAlbum] = await Promise.all([
    dataClient.models.Album.list({
      filter: {
        spotifyUserId: { eq: session.spotifyUserId },
        spotifyArtistId: { eq: artistId },
      },
    }),
    getListenStatsByAlbum(session.spotifyUserId),
  ]);

  const artistName = albums[0]?.artistName ?? "Artist";

  const sortedAlbums = sortAlbums(albums, sort, listenStatsByAlbum);

  return (
    <PageShell
      title={artistName}
      breadcrumbs={[{ label: "My Queue", href: "/queue" }, { label: artistName }]}
      titleActions={
        <AddIconButton
          label={`Find more albums by ${artistName}`}
          href={`/queue/search/artist/${artistId}`}
          variant="secondary"
          className="translate-y-[2px]"
        />
      }
      actions={
        albums.length > 0 && (
          <SortSelect sort={sort} options={ARTIST_PAGE_ALBUM_SORT_OPTIONS} />
        )
      }
    >
      {albums.length === 0 ? (
        <EmptyState
          title="No albums queued for this artist"
          description="Albums you queue for this artist will show up here."
        />
      ) : (
        <VStack gap="sm">
          {sortedAlbums.map((album) => (
            <AlbumRow
              key={album.id}
              name={album.name}
              artistName={album.artistName}
              artistHref={`/queue/artist/${artistId}`}
              imageUrl={album.imageUrl}
              spotifyAlbumId={album.spotifyAlbumId}
              href={`/queue/album/${album.spotifyAlbumId}`}
              progress={
                album.totalTracks != null
                  ? {
                      played:
                        listenStatsByAlbum.get(album.spotifyAlbumId)?.playedTrackIds.size ?? 0,
                      total: album.totalTracks,
                    }
                  : undefined
              }
              endContent={
                <form action={removeAlbum.bind(null, album.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    label="Remove"
                  />
                </form>
              }
            />
          ))}
        </VStack>
      )}
    </PageShell>
  );
}
