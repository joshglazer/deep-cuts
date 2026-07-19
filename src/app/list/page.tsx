import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dataClient } from "@/lib/amplify-server";
import { getArtists } from "@/lib/spotify";
import { PageShell } from "@/components/PageShell";
import { AlbumList } from "./AlbumList";
import { FilterPopover } from "./FilterPopover";
import { getListenStatsByAlbum } from "./listenProgress";
import { artistListHref } from "./routes";
import { parseAlbumSort, sortAlbums } from "./sortAlbums";
import { AddIconButton } from "@/design/molecules/AddIconButton";
import { ArtistRow } from "@/design/molecules/ArtistRow";
import { EmptyState } from "@/design/atoms/EmptyState";
import { VStack } from "@/design/atoms/Stack";

interface ListPageProps {
  searchParams: Promise<{ view?: string; sort?: string; completed?: string }>;
}

export default async function ListPage({ searchParams }: Readonly<ListPageProps>) {
  const session = await auth();
  if (!session?.spotifyUserId) {
    redirect("/");
  }

  const { view: viewParam, sort: sortParam, completed: completedParam } = await searchParams;
  const view = viewParam === "artist" ? "artist" : "flat";
  const sort = parseAlbumSort(sortParam);
  const showCompleted = completedParam === "show";

  // TODO (backend build-out): add a secondary index on spotifyUserId so this
  // scales past a full table scan, and add UI for searching Spotify and
  // adding artists (album search/add already lives at /list/search).
  const [{ data: albums }, listenStatsByAlbum] = await Promise.all([
    dataClient.models.Album.list({
      filter: { spotifyUserId: { eq: session.spotifyUserId } },
    }),
    getListenStatsByAlbum(session.spotifyUserId),
  ]);

  const hasCompletedAlbums = albums.some((album) => album.completedAt);
  const visibleAlbums = albums.filter((album) =>
    showCompleted ? album.completedAt : !album.completedAt
  );
  const hasNoVisibleAlbums = albums.length > 0 && visibleAlbums.length === 0;

  const sortedAlbums = sortAlbums(visibleAlbums, sort, listenStatsByAlbum);

  const artistGroups = Array.from(
    sortedAlbums
      .reduce((groups, album) => {
        const existing = groups.get(album.spotifyArtistId);
        if (existing) {
          existing.albumCount += 1;
        } else {
          groups.set(album.spotifyArtistId, {
            spotifyArtistId: album.spotifyArtistId,
            name: album.artistName,
            imageUrl: album.imageUrl,
            albumCount: 1,
          });
        }
        return groups;
      }, new Map<string, { spotifyArtistId: string; name: string; imageUrl?: string | null; albumCount: number }>())
      .values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Swap in the artist's real profile image where we can — falls back to the
  // first listed album's cover (set above) if Spotify's API is unreachable.
  if (view === "artist" && artistGroups.length > 0) {
    try {
      const spotifyArtistIds = artistGroups.map((artist) => artist.spotifyArtistId);
      const profileImages = new Map<string, string | undefined>();
      for (let i = 0; i < spotifyArtistIds.length; i += 50) {
        const { artists: spotifyArtists } = await getArtists(
          spotifyArtistIds.slice(i, i + 50)
        );
        for (const spotifyArtist of spotifyArtists) {
          profileImages.set(spotifyArtist.id, spotifyArtist.images[0]?.url);
        }
      }
      for (const artist of artistGroups) {
        const profileImage = profileImages.get(artist.spotifyArtistId);
        if (profileImage) {
          artist.imageUrl = profileImage;
        }
      }
    } catch {
      // Ignore — rows keep the album-cover fallback set above.
    }
  }

  return (
    <PageShell
      title="My List"
      titleActions={
        <AddIconButton
          href="/list/search"
          label="Add to List"
          variant="secondary"
          className="translate-y-[2px]"
        />
      }
      actions={
        albums.length > 0 && (
          <FilterPopover
            view={view}
            sort={sort}
            showCompleted={showCompleted}
            hasCompletedAlbums={hasCompletedAlbums}
          />
        )
      }
    >
      {albums.length === 0 ? (
        <EmptyState
          title="Nothing on your list yet"
          description="Search and add an artist or album to get started."
        />
      ) : hasNoVisibleAlbums ? (
        <EmptyState
          title={showCompleted ? "No completed albums yet" : "All caught up"}
          description={
            showCompleted
              ? "Albums you've fully listened to will show up here."
              : "Every album on your list has been fully listened to. Turn on “Show completed” to see them."
          }
        />
      ) : view === "artist" ? (
        <VStack gap="sm">
          {artistGroups.map((artist) => (
            <ArtistRow
              key={artist.spotifyArtistId}
              name={artist.name}
              imageUrl={artist.imageUrl}
              albumCount={artist.albumCount}
              href={artistListHref(artist.spotifyArtistId)}
            />
          ))}
        </VStack>
      ) : (
        <AlbumList albums={sortedAlbums} listenStatsByAlbum={listenStatsByAlbum} />
      )}
    </PageShell>
  );
}
