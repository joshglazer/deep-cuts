"use server";

import { revalidatePath } from "next/cache";
import { requireSignedIn, requireSpotifyUserIdOrThrow } from "@/auth";
import { dataClient } from "@/lib/amplify-server";
import { albumHref, artistListHref } from "./routes";
import {
  search as searchSpotify,
  getArtists,
  getArtistAlbums,
  type SpotifyAlbum,
} from "@/lib/spotify";

export interface AlbumSearchResult {
  spotifyAlbumId: string;
  spotifyArtistId: string;
  name: string;
  artistName: string;
  imageUrl?: string;
  releaseYear?: string;
  totalTracks: number;
}

export interface ArtistSearchResult {
  spotifyArtistId: string;
  name: string;
  imageUrl?: string;
}

function toAlbumSearchResult(album: SpotifyAlbum): AlbumSearchResult {
  return {
    spotifyAlbumId: album.id,
    spotifyArtistId: album.artists[0]?.id ?? "",
    name: album.name,
    artistName: album.artists.map((artist) => artist.name).join(", "),
    imageUrl: album.images[0]?.url,
    releaseYear: album.release_date?.slice(0, 4),
    totalTracks: album.total_tracks,
  };
}

export async function search(query: string): Promise<{
  artists: ArtistSearchResult[];
  albums: AlbumSearchResult[];
}> {
  await requireSignedIn();
  if (!query.trim()) return { artists: [], albums: [] };

  const { artists, albums } = await searchSpotify(query);
  return {
    artists: artists.items.map((artist) => ({
      spotifyArtistId: artist.id,
      name: artist.name,
      imageUrl: artist.images[0]?.url,
    })),
    albums: albums.items.map(toAlbumSearchResult),
  };
}

export async function getArtistDiscography(artistId: string): Promise<{
  artistName: string;
  imageUrl?: string;
  albums: AlbumSearchResult[];
}> {
  await requireSignedIn();

  const [{ artists }, spotifyAlbums] = await Promise.all([
    getArtists([artistId]),
    getArtistAlbums(artistId),
  ]);
  const artist = artists[0];

  // Spotify's artist-albums endpoint returns a separate entry per market
  // re-release, so dedupe by name, keeping the earliest release of each.
  const byName = new Map<string, SpotifyAlbum>();
  for (const album of spotifyAlbums) {
    const key = album.name.trim().toLowerCase();
    const existing = byName.get(key);
    if (!existing || album.release_date < existing.release_date) {
      byName.set(key, album);
    }
  }

  const albums = Array.from(byName.values())
    .sort((a, b) => a.release_date.localeCompare(b.release_date))
    .map(toAlbumSearchResult);

  return {
    artistName: artist?.name ?? "Artist",
    imageUrl: artist?.images[0]?.url,
    albums,
  };
}

export async function addAlbum(album: AlbumSearchResult) {
  const spotifyUserId = await requireSpotifyUserIdOrThrow();

  // No secondary index on spotifyUserId yet (see list/page.tsx TODO), so
  // this dedupe check is a full table scan like the rest of this page.
  const { data: existing } = await dataClient.models.Album.list({
    filter: {
      spotifyUserId: { eq: spotifyUserId },
      spotifyAlbumId: { eq: album.spotifyAlbumId },
    },
  });
  if (existing.length > 0) return;

  await dataClient.models.Album.create({
    spotifyUserId,
    spotifyAlbumId: album.spotifyAlbumId,
    spotifyArtistId: album.spotifyArtistId,
    name: album.name,
    artistName: album.artistName,
    imageUrl: album.imageUrl,
    addedAt: new Date().toISOString(),
    totalTracks: album.totalTracks,
  });

  revalidatePath("/list");
}

export async function removeAlbum(id: string) {
  const spotifyUserId = await requireSpotifyUserIdOrThrow();

  const { data: album } = await dataClient.models.Album.get({ id });
  if (!album || album.spotifyUserId !== spotifyUserId) {
    return;
  }

  await dataClient.models.Album.delete({ id });
  revalidatePath("/list");
}

/**
 * Deletes this user's listen events for an album, optionally narrowed to a
 * single track. Returns the number removed so callers can bail out when
 * there was nothing to reset.
 */
async function deleteListenEvents(
  spotifyUserId: string,
  spotifyAlbumId: string,
  spotifyTrackId?: string
): Promise<number> {
  const { data: events } =
    await dataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId({
      spotifyUserId,
      spotifyAlbumId: { eq: spotifyAlbumId },
    });
  const matches = spotifyTrackId
    ? events.filter((event) => event.spotifyTrackId === spotifyTrackId)
    : events;

  await Promise.all(matches.map((event) => dataClient.models.ListenEvent.delete({ id: event.id })));
  return matches.length;
}

// Every surface showing this album's progress: the list page, the artist's
// page (progress bar and completed badge), and the album's own track list.
// The artist path is skipped only when the album isn't on the user's list,
// so there's no artist id to build it from.
function revalidateAlbumPaths(spotifyAlbumId: string, spotifyArtistId?: string) {
  revalidatePath("/list");
  revalidatePath(albumHref(spotifyAlbumId));
  if (spotifyArtistId) {
    revalidatePath(artistListHref(spotifyArtistId));
  }
}

export async function resetAlbumProgress(id: string) {
  const spotifyUserId = await requireSpotifyUserIdOrThrow();

  const { data: album } = await dataClient.models.Album.get({ id });
  if (!album || album.spotifyUserId !== spotifyUserId) {
    return;
  }

  await deleteListenEvents(spotifyUserId, album.spotifyAlbumId);

  if (album.completedAt) {
    await dataClient.models.Album.update({ id: album.id, completedAt: null });
  }

  revalidateAlbumPaths(album.spotifyAlbumId, album.spotifyArtistId);
}

export async function resetTrackProgress(spotifyAlbumId: string, spotifyTrackId: string) {
  const spotifyUserId = await requireSpotifyUserIdOrThrow();

  const deleted = await deleteListenEvents(spotifyUserId, spotifyAlbumId, spotifyTrackId);
  if (deleted === 0) return;

  // Dropping below totalTracks means the album is no longer fully played —
  // no secondary index on spotifyAlbumId alone, so this is a filtered scan
  // like addAlbum's dedupe check above.
  const { data: albums } = await dataClient.models.Album.list({
    filter: {
      spotifyUserId: { eq: spotifyUserId },
      spotifyAlbumId: { eq: spotifyAlbumId },
    },
  });
  const album = albums[0];
  if (album?.completedAt) {
    await dataClient.models.Album.update({ id: album.id, completedAt: null });
  }

  revalidateAlbumPaths(spotifyAlbumId, album?.spotifyArtistId);
}
