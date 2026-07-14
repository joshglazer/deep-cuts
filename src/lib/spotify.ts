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
}

const MAX_RATE_LIMIT_RETRIES = 3;

/**
 * Thin fetch wrapper for a caller-supplied access token (user or app).
 * Retries on 429 using Spotify's Retry-After header — worth honoring since
 * search/artist lookups now share one app-level token (see getAppAccessToken
 * below), so a throttle hit is correlated across every signed-in user rather
 * than isolated to one person's token.
 */
async function spotifyFetch<T>(path: string, accessToken: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${SPOTIFY_API_BASE}${path}`, {
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

  const clientId = process.env.AUTH_SPOTIFY_ID;
  const clientSecret = process.env.AUTH_SPOTIFY_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing AUTH_SPOTIFY_ID/AUTH_SPOTIFY_SECRET for Spotify client-credentials auth"
    );
  }

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`Spotify token error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  // Refresh a bit early so a request never races an about-to-expire token.
  cachedAppToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedAppToken.token;
}

async function spotifyAppFetch<T>(path: string): Promise<T> {
  return spotifyFetch<T>(path, await getAppAccessToken());
}

export function searchArtists(query: string) {
  return spotifyAppFetch<{ artists: { items: SpotifyArtist[] } }>(
    `/search?type=artist&q=${encodeURIComponent(query)}`
  );
}

export function searchAlbums(query: string) {
  return spotifyAppFetch<{ albums: { items: SpotifyAlbum[] } }>(
    `/search?type=album&q=${encodeURIComponent(query)}`
  );
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
    "/me/player/recently-played?limit=50",
    accessToken
  );
}
