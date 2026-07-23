"use server";

import { requireSpotifyUserIdOrThrow, signOut } from "@/auth";
import { dataClient } from "@/lib/amplify-server";

export async function deleteAccount() {
  const spotifyUserId = await requireSpotifyUserIdOrThrow();

  const [{ data: albums }, { data: artists }, { data: listenEvents }] = await Promise.all([
    dataClient.models.Album.list({ filter: { spotifyUserId: { eq: spotifyUserId } } }),
    dataClient.models.Artist.list({ filter: { spotifyUserId: { eq: spotifyUserId } } }),
    dataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId({
      spotifyUserId,
    }),
  ]);

  await Promise.all([
    ...albums.map((album) => dataClient.models.Album.delete({ id: album.id })),
    ...artists.map((artist) => dataClient.models.Artist.delete({ id: artist.id })),
    ...listenEvents.map((event) => dataClient.models.ListenEvent.delete({ id: event.id })),
    dataClient.models.SpotifyAuth.delete({ spotifyUserId }),
  ]);

  await signOut({ redirectTo: "/" });
}
