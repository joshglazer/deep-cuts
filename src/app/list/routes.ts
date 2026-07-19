export function albumHref(spotifyAlbumId: string) {
  return `/list/album/${spotifyAlbumId}`;
}

export function artistListHref(spotifyArtistId: string) {
  return `/list/artist/${spotifyArtistId}`;
}

export function artistSearchHref(spotifyArtistId: string) {
  return `/list/search/artist/${spotifyArtistId}`;
}
