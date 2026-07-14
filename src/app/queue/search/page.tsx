import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { AlbumSearch } from "../AlbumSearch";
import { Heading } from "@/design/atoms/Heading";

export default async function QueueSearchPage() {
  const session = await auth();
  if (!session?.spotifyUserId) {
    redirect("/");
  }

  return (
    <div>
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Heading level={1} className="mb-8">
          Add to Queue
        </Heading>

        <AlbumSearch />
      </div>
    </div>
  );
}
