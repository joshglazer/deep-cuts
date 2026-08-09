import { dataClient } from "@/lib/amplify-server";
import { listAllListenEvents } from "@/lib/listenEvents";

export interface RecentActivityItem {
  id: string;
  trackName: string;
  playedAt: string;
  spotifyAlbumId?: string | null;
  albumName?: string;
  artistName?: string;
  imageUrl?: string | null;
}

const RECENT_ACTIVITY_LIMIT = 50;

export async function getRecentActivity(spotifyUserId: string): Promise<RecentActivityItem[]> {
  const [events, { data: albums }] = await Promise.all([
    listAllListenEvents({ spotifyUserId }),
    dataClient.models.Album.listAlbumBySpotifyUserIdAndSpotifyAlbumId({ spotifyUserId }),
  ]);

  const albumsById = new Map(albums.map((album) => [album.spotifyAlbumId, album]));

  return events
    .filter((event) => !event.excludedAt)
    .sort((a, b) => b.playedAt.localeCompare(a.playedAt))
    .slice(0, RECENT_ACTIVITY_LIMIT)
    .map((event) => {
      const album = event.spotifyAlbumId ? albumsById.get(event.spotifyAlbumId) : undefined;
      return {
        id: event.id,
        trackName: event.trackName,
        playedAt: event.playedAt,
        spotifyAlbumId: event.spotifyAlbumId,
        albumName: album?.name,
        artistName: album?.artistName,
        imageUrl: album?.imageUrl,
      };
    });
}
