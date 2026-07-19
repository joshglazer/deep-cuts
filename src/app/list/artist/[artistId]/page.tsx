import { requireSpotifyUserIdOrRedirect } from "@/auth";
import { dataClient } from "@/lib/amplify-server";
import { PageShell } from "@/components/PageShell";
import { AlbumList } from "@/app/list/AlbumList";
import { FilterPopover } from "@/app/list/FilterPopover";
import { getListenStatsByAlbum } from "@/app/list/listenProgress";
import { artistSearchHref } from "@/app/list/routes";
import {
  ARTIST_PAGE_ALBUM_SORT_OPTIONS,
  parseAlbumSort,
  sortAlbums,
} from "@/app/list/sortAlbums";
import { AddIconButton } from "@/design/molecules/AddIconButton";
import { EmptyState } from "@/design/atoms/EmptyState";

interface ArtistListPageProps {
  params: Promise<{ artistId: string }>;
  searchParams: Promise<{ sort?: string; completed?: string }>;
}

export default async function ArtistListPage({
  params,
  searchParams,
}: Readonly<ArtistListPageProps>) {
  const spotifyUserId = await requireSpotifyUserIdOrRedirect();

  const { artistId } = await params;
  const { sort: sortParam, completed: completedParam } = await searchParams;
  const sort = parseAlbumSort(sortParam);
  const showCompleted = completedParam === "show";

  const [{ data: albums }, listenStatsByAlbum] = await Promise.all([
    dataClient.models.Album.list({
      filter: {
        spotifyUserId: { eq: spotifyUserId },
        spotifyArtistId: { eq: artistId },
      },
    }),
    getListenStatsByAlbum(spotifyUserId),
  ]);

  const artistName = albums[0]?.artistName ?? "Artist";
  const hasCompletedAlbums = albums.some((album) => album.completedAt);
  const visibleAlbums = albums.filter((album) =>
    showCompleted ? album.completedAt : !album.completedAt
  );
  const hasNoVisibleAlbums = albums.length > 0 && visibleAlbums.length === 0;

  const sortedAlbums = sortAlbums(visibleAlbums, sort, listenStatsByAlbum);

  return (
    <PageShell
      title={artistName}
      breadcrumbs={[{ label: "My List", href: "/list" }, { label: artistName }]}
      titleActions={
        <AddIconButton
          label={`Find more albums by ${artistName}`}
          href={artistSearchHref(artistId)}
          variant="secondary"
          className="translate-y-[2px]"
        />
      }
      actions={
        albums.length > 0 && (
          <FilterPopover
            sort={sort}
            sortOptions={ARTIST_PAGE_ALBUM_SORT_OPTIONS}
            showCompleted={showCompleted}
            hasCompletedAlbums={hasCompletedAlbums}
          />
        )
      }
    >
      {albums.length === 0 ? (
        <EmptyState
          title="No albums on your list for this artist"
          description="Albums you add for this artist will show up here."
        />
      ) : hasNoVisibleAlbums ? (
        <EmptyState
          title={showCompleted ? "No completed albums yet" : "All caught up"}
          description={
            showCompleted
              ? "Albums by this artist you've fully listened to will show up here."
              : "Every album on your list by this artist has been fully listened to. Turn on “Show completed” to see them."
          }
        />
      ) : (
        <AlbumList albums={sortedAlbums} listenStatsByAlbum={listenStatsByAlbum} />
      )}
    </PageShell>
  );
}
