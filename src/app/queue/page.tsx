import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dataClient } from "@/lib/amplify-server";
import { getArtists } from "@/lib/spotify";
import { PageShell } from "@/components/PageShell";
import { removeAlbum } from "./actions";
import { FilterPopover } from "./FilterPopover";
import { getListenStatsByAlbum } from "./listenProgress";
import { parseAlbumSort, sortAlbums } from "./sortAlbums";
import { AddIconButton } from "@/design/molecules/AddIconButton";
import { AlbumRow } from "@/design/molecules/AlbumRow";
import { ArtistRow } from "@/design/molecules/ArtistRow";
import { Button } from "@/design/atoms/Button";
import { EmptyState } from "@/design/atoms/EmptyState";
import { VStack } from "@/design/atoms/Stack";
import { Text } from "@/design/atoms/Text";

interface QueuePageProps {
  searchParams: Promise<{ view?: string; sort?: string; completed?: string }>;
}

export default async function QueuePage({ searchParams }: Readonly<QueuePageProps>) {
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
  // queuing artists (album search/queue already lives at /queue/search).
  const [{ data: artists }, { data: albums }, listenStatsByAlbum] = await Promise.all([
    dataClient.models.Artist.list({
      filter: { spotifyUserId: { eq: session.spotifyUserId } },
    }),
    dataClient.models.Album.list({
      filter: { spotifyUserId: { eq: session.spotifyUserId } },
    }),
    getListenStatsByAlbum(session.spotifyUserId),
  ]);

  const isEmpty = artists.length === 0 && albums.length === 0;
  const hasCompletedAlbums = albums.some((album) => album.completedAt);
  const visibleAlbums = albums.filter((album) =>
    showCompleted ? album.completedAt : !album.completedAt
  );
  const hasNoVisibleAlbums =
    !isEmpty && artists.length === 0 && albums.length > 0 && visibleAlbums.length === 0;

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
  // first queued album's cover (set above) if Spotify's API is unreachable.
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
      title="My Queue"
      titleActions={
        <AddIconButton
          href="/queue/search"
          label="Add to Queue"
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
      {isEmpty ? (
        <EmptyState
          title="Nothing queued yet"
          description="Search and add an artist or album to get started."
        />
      ) : hasNoVisibleAlbums ? (
        <EmptyState
          title={showCompleted ? "No completed albums yet" : "All caught up"}
          description={
            showCompleted
              ? "Albums you've fully listened to will show up here."
              : "Every queued album has been fully listened to. Turn on “Show completed” to see them."
          }
        />
      ) : (
        <VStack gap="md">
          {artists.map((artist) => (
            <Text key={artist.id}>{artist.name} (artist)</Text>
          ))}

          {view === "artist" ? (
            <VStack gap="sm">
              {artistGroups.map((artist) => (
                <ArtistRow
                  key={artist.spotifyArtistId}
                  name={artist.name}
                  imageUrl={artist.imageUrl}
                  albumCount={artist.albumCount}
                  href={`/queue/artist/${artist.spotifyArtistId}`}
                />
              ))}
            </VStack>
          ) : (
            <VStack gap="sm">
              {sortedAlbums.map((album) => (
                <AlbumRow
                  key={album.id}
                  name={album.name}
                  artistName={album.artistName}
                  artistHref={`/queue/artist/${album.spotifyArtistId}`}
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
                  isCompleted={Boolean(album.completedAt)}
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
        </VStack>
      )}
    </PageShell>
  );
}
