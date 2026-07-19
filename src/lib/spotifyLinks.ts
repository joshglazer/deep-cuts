/**
 * Deep link that opens the album in the Spotify app rather than the web
 * player. Lives here rather than in src/app/list/routes.ts so the design
 * layer can use it too — src/design must not import from src/app.
 */
export function spotifyAlbumUri(spotifyAlbumId: string) {
  return `spotify:album:${spotifyAlbumId}`;
}
