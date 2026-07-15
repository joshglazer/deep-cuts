"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { dataClient } from "@/lib/amplify-server";
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
  };
}

export async function search(query: string): Promise<{
  artists: ArtistSearchResult[];
  albums: AlbumSearchResult[];
}> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not signed in");
  }
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
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not signed in");
  }

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

export async function queueAlbum(album: AlbumSearchResult) {
  const session = await auth();
  if (!session?.spotifyUserId) {
    throw new Error("Not signed in");
  }

  // No secondary index on spotifyUserId yet (see queue/page.tsx TODO), so
  // this dedupe check is a full table scan like the rest of this page.
  const { data: existing } = await dataClient.models.Album.list({
    filter: {
      spotifyUserId: { eq: session.spotifyUserId },
      spotifyAlbumId: { eq: album.spotifyAlbumId },
    },
  });
  if (existing.length > 0) return;

  await dataClient.models.Album.create({
    spotifyUserId: session.spotifyUserId,
    spotifyAlbumId: album.spotifyAlbumId,
    spotifyArtistId: album.spotifyArtistId,
    name: album.name,
    artistName: album.artistName,
    imageUrl: album.imageUrl,
    queuedAt: new Date().toISOString(),
  });

  revalidatePath("/queue");
}

export async function removeAlbum(id: string) {
  const session = await auth();
  if (!session?.spotifyUserId) {
    throw new Error("Not signed in");
  }

  const { data: album } = await dataClient.models.Album.get({ id });
  if (!album || album.spotifyUserId !== session.spotifyUserId) {
    return;
  }

  await dataClient.models.Album.delete({ id });
  revalidatePath("/queue");
}
