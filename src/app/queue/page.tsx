import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dataClient } from "@/lib/amplify-server";
import { Header } from "@/components/Header";
import { AlbumSearch } from "./AlbumSearch";
import { removeAlbum } from "./actions";
import { AlbumRow } from "@/design/molecules/AlbumRow";
import { Button } from "@/design/atoms/Button";
import { EmptyState } from "@/design/atoms/EmptyState";
import { Heading } from "@/design/atoms/Heading";
import { Text } from "@/design/atoms/Text";
import { VStack } from "@/design/atoms/Stack";

export default async function QueuePage() {
  const session = await auth();
  if (!session?.spotifyUserId) {
    redirect("/");
  }

  // TODO (backend build-out): add a secondary index on spotifyUserId so this
  // scales past a full table scan, and add UI for searching Spotify and
  // queuing artists (album search/queue already lives in AlbumSearch.tsx).
  const [{ data: artists }, { data: albums }] = await Promise.all([
    dataClient.models.Artist.list({
      filter: { spotifyUserId: { eq: session.spotifyUserId } },
    }),
    dataClient.models.Album.list({
      filter: { spotifyUserId: { eq: session.spotifyUserId } },
    }),
  ]);

  const isEmpty = artists.length === 0 && albums.length === 0;

  return (
    <div>
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Heading level={1} className="mb-8">
          Your queue
        </Heading>

        <AlbumSearch />

        {isEmpty ? (
          <EmptyState
            title="Nothing queued yet"
            description="Search and add an artist or album to get started."
          />
        ) : (
          <VStack gap="sm">
            {artists.map((artist) => (
              <Text key={artist.id}>{artist.name} (artist)</Text>
            ))}
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
