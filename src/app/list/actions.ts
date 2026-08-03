"use server";

import { revalidatePath } from "next/cache";
import { auth, requireSignedIn, requireSpotifyUserIdOrThrow } from "@/auth";
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
  albumType: "album" | "single" | "compilation";
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
    albumType: album.album_type,
  };
}

// The preview-login path (see requireSignedIn's doc comment in auth.ts) has
// no spotifyUserId, so there's nothing to check membership against there.
// No secondary index on spotifyUserId yet (see list/page.tsx TODO), so this
// is a full table scan like addAlbum's dedupe check below.
async function getUserAlbumIds(spotifyUserId: string | undefined): Promise<Set<string>> {
  if (!spotifyUserId) return new Set();
  const { data } = await dataClient.models.Album.list({
    filter: { spotifyUserId: { eq: spotifyUserId } },
  });
  return new Set(data.map((album) => album.spotifyAlbumId));
}

// Narrows the user's full album-id set down to just the ids present in this
// result page, rather than returning the whole set to the client — the
// user's list only grows over time, while a result page stays small.
function addedAlbumIdsIn(albums: AlbumSearchResult[], userAlbumIds: Set<string>): string[] {
  return albums.map((album) => album.spotifyAlbumId).filter((id) => userAlbumIds.has(id));
}

export async function search(query: string): Promise<{
  artists: ArtistSearchResult[];
  albums: AlbumSearchResult[];
  addedAlbumIds: string[];
}> {
  await requireSignedIn();
  if (!query.trim()) return { artists: [], albums: [], addedAlbumIds: [] };

  const session = await auth();
  const [{ artists, albums }, userAlbumIds] = await Promise.all([
    searchSpotify(query),
    getUserAlbumIds(session?.spotifyUserId),
  ]);
  const mappedAlbums = albums.items.map(toAlbumSearchResult);
  return {
    artists: artists.items.map((artist) => ({
      spotifyArtistId: artist.id,
      name: artist.name,
      imageUrl: artist.images[0]?.url,
    })),
    albums: mappedAlbums,
    addedAlbumIds: addedAlbumIdsIn(mappedAlbums, userAlbumIds),
  };
}

export async function getArtistDiscography(artistId: string): Promise<{
  artistName: string;
  imageUrl?: string;
  albums: AlbumSearchResult[];
  addedAlbumIds: string[];
}> {
  await requireSignedIn();

  const session = await auth();
  const [{ artists }, spotifyAlbums, userAlbumIds] = await Promise.all([
    getArtists([artistId]),
    getArtistAlbums(artistId),
    getUserAlbumIds(session?.spotifyUserId),
  ]);
  const artist = artists[0];

  // Spotify's artist-albums endpoint returns a separate entry per market
  // re-release, so dedupe by name, keeping the earliest release of each.
  // Keyed on album_type too, since an album and a single can share a name
  // (e.g. a title-track single from an LP of the same name) and are
  // distinct releases that should both show up.
  const byNameAndType = new Map<string, SpotifyAlbum>();
  for (const album of spotifyAlbums) {
    const key = `${album.album_type}:${album.name.trim().toLowerCase()}`;
    const existing = byNameAndType.get(key);
    if (!existing || album.release_date < existing.release_date) {
      byNameAndType.set(key, album);
    }
  }

  const albums = Array.from(byNameAndType.values())
    .sort((a, b) => a.release_date.localeCompare(b.release_date))
    .map(toAlbumSearchResult);

  return {
    artistName: artist?.name ?? "Artist",
    imageUrl: artist?.images[0]?.url,
    albums,
    addedAlbumIds: addedAlbumIdsIn(albums, userAlbumIds),
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
 * Soft-deletes this user's listen events for an album, optionally narrowed
 * to a single track, by stamping excludedAt rather than deleting the row —
 * see the ListenEvent.excludedAt comment in amplify/data/resource.ts for why.
 * Returns the number excluded so callers can bail out when there was
 * nothing to reset.
 */
async function excludeListenEvents(
  spotifyUserId: string,
  spotifyAlbumId: string,
  spotifyTrackId?: string
): Promise<number> {
  const { data: events } =
    await dataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId({
      spotifyUserId,
      spotifyAlbumId: { eq: spotifyAlbumId },
    });
  const matches = (
    spotifyTrackId ? events.filter((event) => event.spotifyTrackId === spotifyTrackId) : events
  ).filter((event) => !event.excludedAt);

  const excludedAt = new Date().toISOString();
  await Promise.all(
    matches.map((event) => dataClient.models.ListenEvent.update({ id: event.id, excludedAt }))
  );
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

  await excludeListenEvents(spotifyUserId, album.spotifyAlbumId);

  if (album.completedAt) {
    await dataClient.models.Album.update({ id: album.id, completedAt: null });
  }

  revalidateAlbumPaths(album.spotifyAlbumId, album.spotifyArtistId);
}

export async function resetTrackProgress(spotifyAlbumId: string, spotifyTrackId: string) {
  const spotifyUserId = await requireSpotifyUserIdOrThrow();

  const excluded = await excludeListenEvents(spotifyUserId, spotifyAlbumId, spotifyTrackId);
  if (excluded === 0) return;

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
