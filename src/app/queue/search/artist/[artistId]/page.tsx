import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageShell } from "@/components/PageShell";
import { getArtistDiscography } from "@/app/queue/actions";
import { ArtistDiscography } from "./ArtistDiscography";

interface ArtistDiscographyPageProps {
  params: Promise<{ artistId: string }>;
}

export default async function ArtistDiscographyPage({
  params,
}: Readonly<ArtistDiscographyPageProps>) {
  const session = await auth();
  if (!session?.spotifyUserId) {
    redirect("/");
  }

  const { artistId } = await params;
  const { artistName, albums } = await getArtistDiscography(artistId);

  return (
    <PageShell
      title={artistName}
      breadcrumbs={[
        { label: "Add to Queue", href: "/queue/search" },
        { label: artistName },
      ]}
    >
      <ArtistDiscography albums={albums} />
    </PageShell>
  );
}
