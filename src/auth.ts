import NextAuth, { type NextAuthConfig } from "next-auth";
import Spotify from "next-auth/providers/spotify";
import Credentials from "next-auth/providers/credentials";

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

// PR previews get a dynamic amplifyapp.com URL per preview, and Spotify
// requires each OAuth redirect URI to be registered exactly (no wildcards)
// — so previews can't complete the real Spotify sign-in without registering
// that one-off URL first. This flag adds a second, fake-session sign-in path
// so signed-in pages are still viewable without that step. Only ever set
// `ENABLE_PREVIEW_LOGIN=true` on preview branches in the Amplify console
// (scoped to "All pull-request previews"), never on the production branch.
export const previewLoginEnabled = process.env.ENABLE_PREVIEW_LOGIN === "true";

const providers: NextAuthConfig["providers"] = [
  Spotify({
    authorization: `https://accounts.spotify.com/authorize?scope=${SPOTIFY_SCOPES}`,
  }),
];

if (previewLoginEnabled) {
  // No real Spotify access token comes with this, so user-specific
  // Spotify features (e.g. recently-played) stay non-functional — but
  // album search still works, since it runs on an app-level Client
  // Credentials token (see spotify.ts) rather than the user's token.
  providers.push(
    Credentials({
      id: "preview",
      name: "Preview sign-in",
      credentials: {},
      async authorize() {
        return { id: "preview-user", name: "Preview User" };
      },
    })
  );
}

// Exported (not just passed to NextAuth below) so the route handler can call
// Auth() directly with a corrected request — see the comment in
// src/app/api/auth/[...nextauth]/route.ts for why that's necessary.
export const authConfig: NextAuthConfig = {
  // Amplify Hosting doesn't set the well-known env vars (e.g. VERCEL_URL)
  // Auth.js otherwise uses to infer its own deployment origin, so without
  // this it can't build absolute callback/redirect URLs — sign-out redirects
  // to literally "undefined" as a result.
  trustHost: true,
  providers,
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
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
