import type { Handler } from "aws-lambda";

/**
 * TODO (backend build-out):
 *  1. Look up connected users and their stored Spotify refresh tokens.
 *  2. Refresh each user's access token.
 *  3. Call GET https://api.spotify.com/v1/me/player/recently-played for each.
 *  4. Match returned tracks against that user's queued Artist/Album records.
 *  5. Write a ListenEvent for each match via the Amplify Data client.
 */
export const handler: Handler = async () => {
  console.log("poll-spotify: not yet implemented");
};
