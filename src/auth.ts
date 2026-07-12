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
  // Amplify Hosting doesn't set the well-known env vars (e.g. VERCEL_URL)
  // Auth.js otherwise uses to infer its own deployment origin, so without
  // this it can't build absolute callback/redirect URLs — sign-out redirects
  // to literally "undefined" as a result.
  trustHost: true,
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
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.spotifyUserId = account.providerAccountId;
      }
      // Only present on initial sign-in — providing a custom jwt callback
      // replaces Auth.js's default one, which otherwise copies these onto
      // the token automatically.
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.spotifyUserId = token.spotifyUserId as string | undefined;
      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email as string;
        session.user.image = token.picture;
      }
      return session;
    },
  },
});
