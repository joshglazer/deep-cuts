import type { ListenEventLike } from "./computeStats";
import { dataClient } from "@/lib/amplify-server";

// Day-bucketed stats (streak, week/month trends, heatmap) need the visitor's
// local calendar day, which the server doesn't know — so this only fetches
// raw events, and StatsView/computeStats do the actual date bucketing
// client-side once the browser's timezone is available.
export async function getListenEvents(spotifyUserId: string): Promise<ListenEventLike[]> {
  const { data: allEvents } =
    await dataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId({
      spotifyUserId,
    });

  return allEvents.filter((event) => !event.excludedAt).map((event) => ({ playedAt: event.playedAt }));
}
