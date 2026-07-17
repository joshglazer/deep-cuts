import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAlbum } from "@/lib/spotify";
import { getPlayedTrackIds } from "@/app/queue/listenProgress";
import { PageShell } from "@/components/PageShell";
import { AspectRatio } from "@/design/atoms/AspectRatio";
import { EmptyState } from "@/design/atoms/EmptyState";
import { Icon } from "@/design/atoms/Icon";
import { Link } from "@/design/atoms/Link";
import { List, ListItem } from "@/design/atoms/List";
import { HStack, VStack } from "@/design/atoms/Stack";
import { Text } from "@/design/atoms/Text";
import { FindMoreAlbumsButton } from "./FindMoreAlbumsButton";

function formatDuration(durationMs: number) {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default async function AlbumTracksPage({
  params,
}: {
  params: Promise<{ albumId: string }>;
}) {
  const session = await auth();
  if (!session?.spotifyUserId) {
    redirect("/");
  }

  const { albumId } = await params;

  const [album, playedTrackIds] = await Promise.all([
    getAlbum(albumId).catch(() => null),
    getPlayedTrackIds(session.spotifyUserId, albumId),
  ]);

  const artistName = album?.artists.map((artist) => artist.name).join(", ");
  const primaryArtist = album?.artists[0];
  const releaseYear = album?.release_date?.slice(0, 4);

  return (
    <PageShell
      title={album?.name ?? "Album"}
      breadcrumbs={[
        { label: "My Queue", href: "/queue" },
        ...(primaryArtist
          ? [
              {
                label: primaryArtist.name,
                href: `/queue/artist/${primaryArtist.id}`,
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
                    href={`spotify:album:${albumId}`}
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
                    href={`/queue/artist/${primaryArtist.id}`}
                    isStandalone
                    color="secondary"
                  >
                    {artistName}
                  </Link>
                  <FindMoreAlbumsButton
                    artistId={primaryArtist.id}
                    artistName={primaryArtist.name}
                  />
                </HStack>
              ) : (
                <Text color="secondary">{artistName}</Text>
              )}
              {releaseYear && <Text color="secondary">{releaseYear}</Text>}
              <Text color="secondary">{album.tracks.items.length} tracks</Text>
            </VStack>
          </HStack>
          <List hasDividers>
            {album.tracks.items.map((track) => (
              <ListItem
                key={track.id}
                label={`${track.track_number}. ${track.name}`}
                endContent={
                  <HStack gap="sm" vAlign="center">
                    {playedTrackIds.has(track.id) && (
                      <Icon icon="check" color="success" size="sm" />
                    )}
                    <Text color="secondary">
                      {formatDuration(track.duration_ms)}
                    </Text>
                  </HStack>
                }
              />
            ))}
          </List>
        </VStack>
      )}
    </PageShell>
  );
}
