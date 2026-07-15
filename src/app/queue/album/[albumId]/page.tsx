import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAlbum } from "@/lib/spotify";
import { PageShell } from "@/components/PageShell";
import { EmptyState } from "@/design/atoms/EmptyState";
import { List, ListItem } from "@/design/atoms/List";
import { Text } from "@/design/atoms/Text";

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

  let album;
  try {
    album = await getAlbum(albumId);
  } catch {
    album = null;
  }

  const artistName = album?.artists.map((artist) => artist.name).join(", ");
  const title = album ? `${album.name} — ${artistName}` : "Album";

  return (
    <PageShell
      title={title}
      breadcrumbs={[
        { label: "My Queue", href: "/queue" },
        { label: album?.name ?? "Album" },
      ]}
    >
      {!album ? (
        <EmptyState
          title="Couldn't load this album"
          description="Something went wrong fetching tracks from Spotify. Try again later."
        />
      ) : (
        <List hasDividers>
          {album.tracks.items.map((track) => (
            <ListItem
              key={track.id}
              label={`${track.track_number}. ${track.name}`}
              endContent={
                <Text color="secondary">{formatDuration(track.duration_ms)}</Text>
              }
            />
          ))}
        </List>
      )}
    </PageShell>
  );
}
