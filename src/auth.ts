import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";

// Scopes needed to read what's currently/recently playing (for the polling
// job) and to look up the user's profile id (used as the partition key for
// their queue and listen history in DynamoDB).
const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-read-recently-played",
  "user-read-currently-playing",
  "user-top-read",
].join(" ");

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Spotify({
      authorization: `https://accounts.spotify.com/authorize?scope=${SPOTIFY_SCOPES}`,
    }),
  ],
  callbacks: {
    // TODO (backend build-out): access tokens expire after 1hr — refresh
    // using token.refreshToken when token.expiresAt has passed, and persist
    // the (encrypted) refresh token somewhere the poll-spotify function can
    // read it, since that function runs on a schedule with no user session.
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.spotifyUserId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.spotifyUserId = token.spotifyUserId as string | undefined;
      return session;
    },
  },
});
