import { dataClient } from "@/lib/amplify-server";

export interface AlbumListenStats {
  playedTrackIds: Set<string>;
  lastPlayedAt?: string;
}

/** One query covers every queued album on the page, via the ListenEvent secondary index on spotifyUserId (sorted by spotifyAlbumId). */
export async function getListenStatsByAlbum(
  spotifyUserId: string
): Promise<Map<string, AlbumListenStats>> {
  const { data: events } =
    await dataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId({
      spotifyUserId,
    });

  const byAlbum = new Map<string, AlbumListenStats>();
  for (const event of events) {
    if (!event.spotifyAlbumId) continue;
    const stats = byAlbum.get(event.spotifyAlbumId) ?? { playedTrackIds: new Set<string>() };
    stats.playedTrackIds.add(event.spotifyTrackId);
    if (!stats.lastPlayedAt || event.playedAt > stats.lastPlayedAt) {
      stats.lastPlayedAt = event.playedAt;
    }
    byAlbum.set(event.spotifyAlbumId, stats);
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
