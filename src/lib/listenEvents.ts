import { dataClient } from "@/lib/amplify-server";

type ListListenEventsFn =
  typeof dataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId;
type ListenEvent = Awaited<ReturnType<ListListenEventsFn>>["data"][number];

/**
 * Amplify list queries return one page at a time; querying this index
 * without draining nextToken silently drops events once a user's history
 * exceeds a page, sorted by spotifyAlbumId, so it's specific albums that go
 * missing rather than a uniform partial result.
 */
export async function listAllListenEvents(
  key: Parameters<ListListenEventsFn>[0]
): Promise<ListenEvent[]> {
  const events: ListenEvent[] = [];
  let nextToken: string | null | undefined;
  do {
    const { data, nextToken: token } =
      await dataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId(key, {
        nextToken,
      });
    events.push(...data);
    nextToken = token;
  } while (nextToken);
  return events;
}
