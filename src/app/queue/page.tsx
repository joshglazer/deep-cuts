import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dataClient } from "@/lib/amplify-server";
import { AlbumSearch } from "./AlbumSearch";
import { removeAlbum } from "./actions";

export default async function QueuePage() {
  const session = await auth();
  if (!session?.spotifyUserId) {
    redirect("/");
  }

  // TODO (backend build-out): add a secondary index on spotifyUserId so this
  // scales past a full table scan, and add UI for searching Spotify and
  // queuing artists/albums (writes through this same client).
  const [{ data: artists }, { data: albums }] = await Promise.all([
    dataClient.models.Artist.list({
      filter: { spotifyUserId: { eq: session.spotifyUserId } },
    }),
    dataClient.models.Album.list({
      filter: { spotifyUserId: { eq: session.spotifyUserId } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-8 text-2xl font-semibold">Your queue</h1>

      <AlbumSearch />

      {artists.length === 0 && albums.length === 0 ? (
        <p className="text-zinc-500">
          Nothing queued yet. Search and add an artist or album to get
          started.
        </p>
      ) : (
        <ul className="space-y-3">
          {artists.map((artist) => (
            <li key={artist.id}>{artist.name} (artist)</li>
          ))}
          {albums.map((album) => (
            <li key={album.id} className="flex items-center justify-between gap-3">
              <span>
                {album.name} — {album.artistName} (album)
              </span>
              <form action={removeAlbum.bind(null, album.id)}>
                <button
                  type="submit"
                  className="text-xs text-zinc-500 hover:text-red-500"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
