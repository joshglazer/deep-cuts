const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

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

/** Thin fetch wrapper — every call needs a valid user access token from the session. */
async function spotifyFetch<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Spotify API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export function searchArtists(query: string, accessToken: string) {
  return spotifyFetch<{ artists: { items: SpotifyArtist[] } }>(
    `/search?type=artist&q=${encodeURIComponent(query)}`,
    accessToken
  );
}

export function searchAlbums(query: string, accessToken: string) {
  return spotifyFetch<{ albums: { items: SpotifyAlbum[] } }>(
    `/search?type=album&q=${encodeURIComponent(query)}`,
    accessToken
  );
}

/** Spotify allows up to 50 ids per call to GET /artists. */
export function getArtists(ids: string[], accessToken: string) {
  return spotifyFetch<{ artists: SpotifyArtist[] }>(
    `/artists?ids=${ids.map(encodeURIComponent).join(",")}`,
    accessToken
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
