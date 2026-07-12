import { defineFunction } from "@aws-amplify/backend";

/**
 * Runs on a fixed schedule and checks connected users' Spotify "recently
 * played" history against their queued artists/albums, recording matches as
 * ListenEvents. Every 15 minutes comfortably covers Spotify's recently-played
 * endpoint, which only returns the last ~50 tracks.
 */
export const pollSpotify = defineFunction({
  name: "poll-spotify",
  entry: "./handler.ts",
  schedule: "every 15m",
  timeoutSeconds: 60,
});
