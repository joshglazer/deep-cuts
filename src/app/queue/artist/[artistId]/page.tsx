import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dataClient } from "@/lib/amplify-server";
import { Header } from "@/components/Header";
import { removeAlbum } from "@/app/queue/actions";
import { AlbumRow } from "@/design/molecules/AlbumRow";
import { Button } from "@/design/atoms/Button";
import { EmptyState } from "@/design/atoms/EmptyState";
import { Heading } from "@/design/atoms/Heading";
import { PageBreadcrumbs } from "@/design/molecules/PageBreadcrumbs";
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
    <div>
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <PageBreadcrumbs
          items={[
            { label: "My Queue", href: "/queue" },
            { label: artistName },
          ]}
          className="mb-4"
        />

        <Heading level={1} className="mb-8">
          {artistName}
        </Heading>

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
      </div>
    </div>
  );
}
