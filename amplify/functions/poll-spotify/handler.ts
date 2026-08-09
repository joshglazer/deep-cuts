import type { Handler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import type { Schema } from "../../data/resource";
import { getRecentlyPlayed, refreshAccessToken } from "../../../src/lib/spotify";
import { env } from "$amplify/env/poll-spotify";

// This function is granted schema-wide IAM access via `allow.resource(...)`
// in amplify/data/resource.ts, so it authenticates as itself rather than
// with the apiKey the Next server uses (see src/lib/amplify-server.ts).
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

export const handler: Handler = async () => {
  const { data: users, errors } = await client.models.SpotifyAuth.list();
  if (errors) {
    console.error("poll-spotify: failed to list SpotifyAuth records", errors);
    return;
  }

  for (const user of users) {
    try {
      await pollUser(user.spotifyUserId, user.refreshToken);
    } catch (error) {
      console.error(`poll-spotify: failed for user ${user.spotifyUserId}`, error);
    }
  }
};

async function pollUser(spotifyUserId: string, storedRefreshToken: string) {
  const refreshed = await refreshAccessToken(storedRefreshToken);
  if (refreshed.refreshToken !== storedRefreshToken) {
    const { errors } = await client.models.SpotifyAuth.update({
      spotifyUserId,
      refreshToken: refreshed.refreshToken,
      updatedAt: new Date().toISOString(),
    });
    if (errors) throw new Error(JSON.stringify(errors));
  }

  const { items: recentlyPlayed } = await getRecentlyPlayed(refreshed.accessToken);
  if (recentlyPlayed.length === 0) return;

  const { data: listedAlbums, errors: albumErrors } = await client.models.Album.list({
    filter: { spotifyUserId: { eq: spotifyUserId } },
  });
  if (albumErrors) throw new Error(JSON.stringify(albumErrors));

  const listedAlbumsById = new Map(listedAlbums.map((album) => [album.spotifyAlbumId, album]));
  const matches = recentlyPlayed.filter((item) => listedAlbumsById.has(item.track.album.id));
  if (matches.length === 0) return;

  // Spotify's recently-played endpoint only ever returns the last ~50
  // plays, so an unpaginated query for this user's existing events is
  // enough to dedupe against — a play from months ago can't reappear here.
  const { data: existingEvents, errors: eventErrors } =
    await client.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId({
      spotifyUserId,
    });
  if (eventErrors) throw new Error(JSON.stringify(eventErrors));

  // Includes excluded (soft-deleted, i.e. reset) rows on purpose: dedupe
  // needs to know the exact spotifyTrackId+playedAt pair was already seen at
  // all, so a play the user reset doesn't get recreated just because
  // Spotify's own recently-played history keeps serving it for a while after
  // the reset.
  const alreadyRecorded = new Set(
    existingEvents.map((event) => `${event.spotifyTrackId}|${event.playedAt}`)
  );

  // Progress is only touched for albums this poll actually saw a play for
  // (bounded by Spotify's ~50-item recently-played page, regardless of list
  // size), seeded from each album's own denormalized playedTrackIds/
  // lastPlayedAt (kept up to date across polls) rather than rescanning the
  // user's whole event history.
  const matchedAlbumIds = new Set(matches.map((item) => item.track.album.id));
  const playedTrackIdsByAlbum = new Map<string, Set<string>>();
  const lastPlayedAtByAlbum = new Map<string, string>();
  for (const albumId of matchedAlbumIds) {
    const album = listedAlbumsById.get(albumId);
    const priorPlayedTrackIds = album?.playedTrackIds?.filter((id): id is string => id != null);
    playedTrackIdsByAlbum.set(albumId, new Set(priorPlayedTrackIds));
    if (album?.lastPlayedAt) lastPlayedAtByAlbum.set(albumId, album.lastPlayedAt);
  }

  for (const item of matches) {
    const dedupeKey = `${item.track.id}|${item.played_at}`;
    if (alreadyRecorded.has(dedupeKey)) continue;

    const { errors: createErrors } = await client.models.ListenEvent.create({
      spotifyUserId,
      spotifyTrackId: item.track.id,
      spotifyAlbumId: item.track.album.id,
      spotifyArtistId: item.track.album.artists[0]?.id,
      trackName: item.track.name,
      playedAt: item.played_at,
    });
    if (createErrors) {
      console.error(`poll-spotify: failed to write ListenEvent for ${spotifyUserId}`, createErrors);
      continue;
    }

    const albumId = item.track.album.id;
    const played = playedTrackIdsByAlbum.get(albumId) ?? new Set<string>();
    played.add(item.track.id);
    playedTrackIdsByAlbum.set(albumId, played);

    const lastPlayedAt = lastPlayedAtByAlbum.get(albumId);
    if (!lastPlayedAt || item.played_at > lastPlayedAt) {
      lastPlayedAtByAlbum.set(albumId, item.played_at);
    }
  }

  for (const albumId of matchedAlbumIds) {
    const album = listedAlbumsById.get(albumId);
    if (!album) continue;

    const playedTrackIds = Array.from(playedTrackIdsByAlbum.get(albumId) ?? []);
    const completedAt =
      album.completedAt ??
      (album.totalTracks != null && playedTrackIds.length >= album.totalTracks
        ? new Date().toISOString()
        : undefined);

    const { errors: updateErrors } = await client.models.Album.update({
      id: album.id,
      playedTrackIds,
      lastPlayedAt: lastPlayedAtByAlbum.get(albumId),
      completedAt,
    });
    if (updateErrors) {
      console.error(`poll-spotify: failed to update progress for album ${album.id}`, updateErrors);
    }
  }
}
