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

  const { data: queuedAlbums, errors: albumErrors } = await client.models.Album.list({
    filter: { spotifyUserId: { eq: spotifyUserId } },
  });
  if (albumErrors) throw new Error(JSON.stringify(albumErrors));

  const queuedAlbumIds = new Set(queuedAlbums.map((album) => album.spotifyAlbumId));
  const matches = recentlyPlayed.filter((item) => queuedAlbumIds.has(item.track.album.id));
  if (matches.length === 0) return;

  // Spotify's recently-played endpoint only ever returns the last ~50
  // plays, so an unpaginated query for this user's existing events is
  // enough to dedupe against — a play from months ago can't reappear here.
  const { data: existingEvents, errors: eventErrors } =
    await client.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId({
      spotifyUserId,
    });
  if (eventErrors) throw new Error(JSON.stringify(eventErrors));

  const alreadyRecorded = new Set(
    existingEvents.map((event) => `${event.spotifyTrackId}|${event.playedAt}`)
  );

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
    }
  }
}
