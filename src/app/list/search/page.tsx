import { requireSpotifyUserIdOrRedirect } from "@/auth";
import { PageShell } from "@/components/PageShell";
import { AlbumSearch } from "../AlbumSearch";

export default async function ListSearchPage() {
  await requireSpotifyUserIdOrRedirect();

  return (
    <PageShell title="Add to List">
      <AlbumSearch />
    </PageShell>
  );
}
