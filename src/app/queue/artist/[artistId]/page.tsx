import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dataClient } from "@/lib/amplify-server";
import { PageShell } from "@/components/PageShell";
import { removeAlbum } from "@/app/queue/actions";
import { AlbumRow } from "@/design/molecules/AlbumRow";
import { Button } from "@/design/atoms/Button";
import { EmptyState } from "@/design/atoms/EmptyState";
import { VStack } from "@/design/atoms/Stack";

export default async function ArtistQueuePage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const session = await auth();
  if (!session?.spotifyUserId) {
    redirect("/");
  }

  const { artistId } = await params;

  const { data: albums } = await dataClient.models.Album.list({
    filter: {
      spotifyUserId: { eq: session.spotifyUserId },
      spotifyArtistId: { eq: artistId },
    },
  });

  const artistName = albums[0]?.artistName ?? "Artist";

  return (
    <PageShell
      title={artistName}
      breadcrumbs={[{ label: "My Queue", href: "/queue" }, { label: artistName }]}
    >
      {albums.length === 0 ? (
        <EmptyState
          title="No albums queued for this artist"
          description="Albums you queue for this artist will show up here."
        />
      ) : (
        <VStack gap="sm">
          {albums.map((album) => (
            <AlbumRow
              key={album.id}
              name={album.name}
              artistName={album.artistName}
              imageUrl={album.imageUrl}
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
