import { defineFunction, secret } from "@aws-amplify/backend";

/**
 * Runs on a fixed schedule and checks connected users' Spotify "recently
 * played" history against the artists/albums on their list, recording matches as
 * ListenEvents. Every 15 minutes comfortably covers Spotify's recently-played
 * endpoint, which only returns the last ~50 tracks.
 */
export const pollSpotify = defineFunction({
  name: "poll-spotify",
  entry: "./handler.ts",
  schedule: "every 15m",
  timeoutSeconds: 60,
  // Same env var names src/lib/spotify.ts reads on the Next server, so
  // refreshAccessToken works unmodified in both runtimes. See README.md's
  // "Listen-tracking secrets" section for how to set these.
  environment: {
    AUTH_SPOTIFY_ID: secret("AUTH_SPOTIFY_ID"),
    AUTH_SPOTIFY_SECRET: secret("AUTH_SPOTIFY_SECRET"),
  },
});
