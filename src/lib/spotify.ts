const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: { url: string }[];
  artists: SpotifyArtist[];
  /** ISO date, precision varies by release: "YYYY", "YYYY-MM", or "YYYY-MM-DD". */
  release_date: string;
  total_tracks: number;
  album_type: "album" | "single" | "compilation";
}

const MAX_RATE_LIMIT_RETRIES = 3;

/**
 * Thin fetch wrapper for a caller-supplied access token (user or app).
 * Retries on 429 using Spotify's Retry-After header — worth honoring since
 * search/artist lookups now share one app-level token (see getAppAccessToken
 * below), so a throttle hit is correlated across every signed-in user rather
 * than isolated to one person's token.
 */
async function spotifyFetch<T>(url: string, accessToken: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      const retryAfterSeconds = Number(res.headers.get("Retry-After")) || 1;
      await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
      continue;
    }

    if (!res.ok) {
      throw new Error(`Spotify API error ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }
}

/**
 * POSTs to Spotify's token endpoint with the app's client credentials as an
 * HTTP Basic header. `context` only shapes the error message, so a failure
 * says which flow it came from (client-credentials vs. refresh).
 */
async function postSpotifyToken<T>(body: URLSearchParams, context: string): Promise<T> {
  const clientId = process.env.AUTH_SPOTIFY_ID;
  const clientSecret = process.env.AUTH_SPOTIFY_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(`Missing AUTH_SPOTIFY_ID/AUTH_SPOTIFY_SECRET for ${context}`);
  }

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`Spotify ${context} error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

let cachedAppToken: { token: string; expiresAt: number } | null = null;

// Search and artist lookups are app-level Spotify data, not tied to any one
// user, so they're fetched with a Client Credentials token (client id +
// secret) rather than the signed-in user's access token. That keeps them
// working even when the user's token has expired or isn't present at all
// (e.g. the preview-login flow — see auth.ts). Cached in-memory per server
// instance since it's the same token for every request until it expires.
async function getAppAccessToken(): Promise<string> {
  if (cachedAppToken && cachedAppToken.expiresAt > Date.now()) {
    return cachedAppToken.token;
  }

  const data = await postSpotifyToken<{ access_token: string; expires_in: number }>(
    new URLSearchParams({ grant_type: "client_credentials" }),
    "client-credentials auth"
  );
  // Refresh a bit early so a request never races an about-to-expire token.
  cachedAppToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedAppToken.token;
}

async function spotifyAppFetch<T>(path: string): Promise<T> {
  return spotifyFetch<T>(`${SPOTIFY_API_BASE}${path}`, await getAppAccessToken());
}

/** Single call covering both result types, so a combined search costs one request instead of two. */
export function search(query: string) {
  return spotifyAppFetch<{
    artists: { items: SpotifyArtist[] };
    albums: { items: SpotifyAlbum[] };
  }>(`/search?type=artist,album&q=${encodeURIComponent(query)}`);
}

export interface RefreshedToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Shared by src/auth.ts (refreshing the signed-in user's session token) and
 * the poll-spotify scheduled function (refreshing on behalf of users with no
 * active session). Spotify sometimes omits `refresh_token` in the response —
 * that means keep using the one you already have, so callers should fall
 * back to the input token rather than treating it as required.
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshedToken> {
  const data = await postSpotifyToken<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    "token refresh"
  );
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  track_number: number;
  duration_ms: number;
  artists: SpotifyArtist[];
}

export interface SpotifyAlbumDetails extends SpotifyAlbum {
  tracks: { items: SpotifyTrack[] };
}

export function getAlbum(id: string) {
  return spotifyAppFetch<SpotifyAlbumDetails>(`/albums/${encodeURIComponent(id)}`);
}

/** Spotify allows up to 50 ids per call to GET /artists. */
export function getArtists(ids: string[]) {
  return spotifyAppFetch<{ artists: SpotifyArtist[] }>(
    `/artists?ids=${ids.map(encodeURIComponent).join(",")}`
  );
}

interface SpotifyAlbumsPage {
  items: SpotifyAlbum[];
  next: string | null;
}

/**
 * Every album/single/compilation credited to an artist, paginating through
 * Spotify's 50-per-page limit. Excludes "appears_on" credits (guest
 * appearances on other artists' compilations) since those aren't part of the
 * artist's own discography.
 */
export async function getArtistAlbums(artistId: string): Promise<SpotifyAlbum[]> {
  const accessToken = await getAppAccessToken();
  const albums: SpotifyAlbum[] = [];

  let url: string | null =
    `${SPOTIFY_API_BASE}/artists/${encodeURIComponent(artistId)}/albums` +
    `?include_groups=album,single,compilation&limit=50`;
  while (url) {
    const page: SpotifyAlbumsPage = await spotifyFetch<SpotifyAlbumsPage>(url, accessToken);
    albums.push(...page.items);
    url = page.next;
  }

  return albums;
}

export interface RecentlyPlayedItem {
  track: {
    id: string;
    name: string;
    album: { id: string; artists: { id: string }[] };
  };
  played_at: string;
}

/** Used by the poll-spotify scheduled function to check for new plays. */
export function getRecentlyPlayed(accessToken: string) {
  return spotifyFetch<{ items: RecentlyPlayedItem[] }>(
    `${SPOTIFY_API_BASE}/me/player/recently-played?limit=50`,
    accessToken
  );
}
