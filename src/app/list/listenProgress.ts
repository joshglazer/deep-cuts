import { listAllListenEvents } from "@/lib/listenEvents";

/** Maps each played track to the most recent date it was streamed. */
export async function getPlayedTrackDates(
  spotifyUserId: string,
  spotifyAlbumId: string
): Promise<Map<string, string>> {
  const events = await listAllListenEvents({
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
