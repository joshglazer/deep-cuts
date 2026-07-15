"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { dataClient } from "@/lib/amplify-server";
import { getAlbum, searchAlbums as searchSpotifyAlbums } from "@/lib/spotify";

export interface AlbumSearchResult {
  spotifyAlbumId: string;
  spotifyArtistId: string;
  name: string;
  artistName: string;
  imageUrl?: string;
}

export async function searchAlbums(
  query: string
): Promise<AlbumSearchResult[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not signed in");
  }
  if (!query.trim()) return [];

  const { albums } = await searchSpotifyAlbums(query);
  return albums.items.map((album) => ({
    spotifyAlbumId: album.id,
    spotifyArtistId: album.artists[0]?.id ?? "",
    name: album.name,
    artistName: album.artists.map((artist) => artist.name).join(", "),
    imageUrl: album.images[0]?.url,
  }));
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

  // Best-effort: used for the "x/y tracks played" progress indicator. If
  // this fetch fails, the album still gets queued — its progress indicator
  // just won't render until it's re-queued.
  let totalTracks: number | undefined;
  try {
    const details = await getAlbum(album.spotifyAlbumId);
    totalTracks = details.tracks.items.length;
  } catch {
    totalTracks = undefined;
  }

  await dataClient.models.Album.create({
    spotifyUserId: session.spotifyUserId,
    spotifyAlbumId: album.spotifyAlbumId,
    spotifyArtistId: album.spotifyArtistId,
    name: album.name,
    artistName: album.artistName,
    imageUrl: album.imageUrl,
    queuedAt: new Date().toISOString(),
    totalTracks,
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
