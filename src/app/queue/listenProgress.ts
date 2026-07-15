import { dataClient } from "@/lib/amplify-server";

/** One query covers every queued album on the page, via the ListenEvent secondary index on spotifyUserId (sorted by spotifyAlbumId). */
export async function getPlayedTrackIdsByAlbum(
  spotifyUserId: string
): Promise<Map<string, Set<string>>> {
  const { data: events } =
    await dataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId({
      spotifyUserId,
    });

  const byAlbum = new Map<string, Set<string>>();
  for (const event of events) {
    if (!event.spotifyAlbumId) continue;
    const played = byAlbum.get(event.spotifyAlbumId) ?? new Set<string>();
    played.add(event.spotifyTrackId);
    byAlbum.set(event.spotifyAlbumId, played);
  }
  return byAlbum;
}

export async function getPlayedTrackIds(
  spotifyUserId: string,
  spotifyAlbumId: string
): Promise<Set<string>> {
  const { data: events } =
    await dataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId({
      spotifyUserId,
      spotifyAlbumId: { eq: spotifyAlbumId },
    });

  return new Set(events.map((event) => event.spotifyTrackId));
}
