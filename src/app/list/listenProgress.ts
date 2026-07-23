import { dataClient } from "@/lib/amplify-server";

export interface AlbumListenStats {
  playedTrackIds: Set<string>;
  lastPlayedAt?: string;
}

/** One query covers every album on the list page, via the ListenEvent secondary index on spotifyUserId (sorted by spotifyAlbumId). */
export async function getListenStatsByAlbum(
  spotifyUserId: string
): Promise<Map<string, AlbumListenStats>> {
  const { data: events } =
    await dataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId({
      spotifyUserId,
    });

  const byAlbum = new Map<string, AlbumListenStats>();
  for (const event of events) {
    if (event.excludedAt || !event.spotifyAlbumId) continue;
    const stats = byAlbum.get(event.spotifyAlbumId) ?? { playedTrackIds: new Set<string>() };
    stats.playedTrackIds.add(event.spotifyTrackId);
    if (!stats.lastPlayedAt || event.playedAt > stats.lastPlayedAt) {
      stats.lastPlayedAt = event.playedAt;
    }
    byAlbum.set(event.spotifyAlbumId, stats);
  }
  return byAlbum;
}

/** Maps each played track to the most recent date it was streamed. */
export async function getPlayedTrackDates(
  spotifyUserId: string,
  spotifyAlbumId: string
): Promise<Map<string, string>> {
  const { data: events } =
    await dataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId({
      spotifyUserId,
      spotifyAlbumId: { eq: spotifyAlbumId },
    });

  const playedAtByTrack = new Map<string, string>();
  for (const event of events) {
    if (event.excludedAt) continue;
    const lastPlayedAt = playedAtByTrack.get(event.spotifyTrackId);
    if (!lastPlayedAt || event.playedAt > lastPlayedAt) {
      playedAtByTrack.set(event.spotifyTrackId, event.playedAt);
    }
  }
  return playedAtByTrack;
}
