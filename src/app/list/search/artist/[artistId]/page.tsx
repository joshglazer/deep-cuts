import { requireSpotifyUserIdOrRedirect } from "@/auth";
import { PageShell } from "@/components/PageShell";
import { getArtistDiscography } from "@/app/list/actions";
import { ArtistDiscography } from "./ArtistDiscography";

interface ArtistDiscographyPageProps {
  params: Promise<{ artistId: string }>;
}

export default async function ArtistDiscographyPage({
  params,
}: Readonly<ArtistDiscographyPageProps>) {
  await requireSpotifyUserIdOrRedirect();

  const { artistId } = await params;
  const { artistName, albums, addedAlbumIds } = await getArtistDiscography(artistId);

  return (
    <PageShell
      title={artistName}
      breadcrumbs={[
        { label: "Add to List", href: "/list/search" },
        { label: artistName },
      ]}
    >
      <ArtistDiscography albums={albums} addedAlbumIds={addedAlbumIds} />
    </PageShell>
  );
}
