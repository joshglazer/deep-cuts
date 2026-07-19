export function albumHref(spotifyAlbumId: string) {
  return `/queue/album/${spotifyAlbumId}`;
}

export function artistQueueHref(spotifyArtistId: string) {
  return `/queue/artist/${spotifyArtistId}`;
}

export function artistSearchHref(spotifyArtistId: string) {
  return `/queue/search/artist/${spotifyArtistId}`;
}
