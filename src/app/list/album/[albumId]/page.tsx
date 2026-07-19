import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dataClient } from "@/lib/amplify-server";
import { formatDate } from "@/lib/formatDate";
import { getAlbum } from "@/lib/spotify";
import { spotifyAlbumUri } from "@/lib/spotifyLinks";
import { getPlayedTrackDates } from "@/app/list/listenProgress";
import { artistListHref, artistSearchHref } from "@/app/list/routes";
import { TrackResetButton } from "./TrackResetButton";
import { PageShell } from "@/components/PageShell";
import { AddIconButton } from "@/design/molecules/AddIconButton";
import { AspectRatio } from "@/design/atoms/AspectRatio";
import { EmptyState } from "@/design/atoms/EmptyState";
import { Icon } from "@/design/atoms/Icon";
import { Link } from "@/design/atoms/Link";
import { List, ListItem } from "@/design/atoms/List";
import { HStack, VStack } from "@/design/atoms/Stack";
import { Text } from "@/design/atoms/Text";
import { Tooltip } from "@/design/atoms/Tooltip";

function formatDuration(durationMs: number) {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface AlbumTracksPageProps {
  params: Promise<{ albumId: string }>;
}

export default async function AlbumTracksPage({ params }: Readonly<AlbumTracksPageProps>) {
  const session = await auth();
  if (!session?.spotifyUserId) {
    redirect("/");
  }

  const { albumId } = await params;

  const [album, playedTrackDates, { data: listedAlbums }] = await Promise.all([
    getAlbum(albumId).catch(() => null),
    getPlayedTrackDates(session.spotifyUserId, albumId),
    dataClient.models.Album.list({
      filter: {
        spotifyUserId: { eq: session.spotifyUserId },
        spotifyAlbumId: { eq: albumId },
      },
    }),
  ]);
  const completedAt = listedAlbums[0]?.completedAt;

  const artistName = album?.artists.map((artist) => artist.name).join(", ");
  const primaryArtist = album?.artists[0];
  const releaseYear = album?.release_date?.slice(0, 4);

  return (
    <PageShell
      title={album?.name ?? "Album"}
      breadcrumbs={[
        { label: "My List", href: "/list" },
        ...(primaryArtist
          ? [
              {
                label: primaryArtist.name,
                href: artistListHref(primaryArtist.id),
              },
            ]
          : []),
        { label: album?.name ?? "Album" },
      ]}
    >
      {!album ? (
        <EmptyState
          title="Couldn't load this album"
          description="Something went wrong fetching tracks from Spotify. Try again later."
        />
      ) : (
        <VStack gap="lg">
          <HStack gap="lg">
            <div className="w-40 shrink-0">
              <AspectRatio ratio={1}>
                {album.images[0] && (
                  <Link
                    href={spotifyAlbumUri(albumId)}
                    target="_blank"
                    isStandalone
                    hasUnderline={false}
                    className="block h-full w-full"
                  >
                    <img
                      src={album.images[0].url}
                      alt=""
                      className="h-full w-full rounded-lg object-cover"
                    />
                  </Link>
                )}
              </AspectRatio>
            </div>
            <VStack gap="sm" justify="center">
              {primaryArtist ? (
                <HStack gap="sm" vAlign="center">
                  <Link
                    href={artistListHref(primaryArtist.id)}
                    isStandalone
                    color="secondary"
                  >
                    {artistName}
                  </Link>
                  <AddIconButton
                    label={`Find more albums by ${primaryArtist.name}`}
                    href={artistSearchHref(primaryArtist.id)}
                  />
                </HStack>
              ) : (
                <Text color="secondary">{artistName}</Text>
              )}
              {releaseYear && <Text color="secondary">{releaseYear}</Text>}
              <Text color="secondary">{album.tracks.items.length} tracks</Text>
              {completedAt && (
                <HStack gap="sm" vAlign="center">
                  <Tooltip content={`Completed ${formatDate(completedAt)}`}>
                    <Icon icon="check" color="success" size="sm" />
                  </Tooltip>
                  <Text color="secondary">Completed</Text>
                </HStack>
              )}
            </VStack>
          </HStack>
          <List hasDividers>
            {album.tracks.items.map((track) => {
              const playedAt = playedTrackDates.get(track.id);
              return (
                <ListItem
                  key={track.id}
                  label={`${track.track_number}. ${track.name}`}
                  endContent={
                    <HStack gap="sm" vAlign="center">
                      {playedAt && (
                        <>
                          <Tooltip content={`Streamed ${formatDate(playedAt)}`}>
                            <Icon icon="check" color="success" size="sm" />
                          </Tooltip>
                          <TrackResetButton
                            spotifyAlbumId={albumId}
                            spotifyTrackId={track.id}
                            trackName={track.name}
                          />
                        </>
                      )}
                      <Text color="secondary">
                        {formatDuration(track.duration_ms)}
                      </Text>
                    </HStack>
                  }
                />
              );
            })}
          </List>
        </VStack>
      )}
    </PageShell>
  );
}
