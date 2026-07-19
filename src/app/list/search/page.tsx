import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageShell } from "@/components/PageShell";
import { AlbumSearch } from "../AlbumSearch";

export default async function ListSearchPage() {
  const session = await auth();
  if (!session?.spotifyUserId) {
    redirect("/");
  }

  return (
    <PageShell title="Add to List">
      <AlbumSearch />
    </PageShell>
  );
}
