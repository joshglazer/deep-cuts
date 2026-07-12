/**
 * Deep Cuts Theme (Spotify branding)
 *
 * Extends Astryx's Neutral theme (https://astryx.atmeta.com) rather than
 * forking it: `extends` pulls in all of Neutral's tokens, component
 * overrides, and icons, and only the deltas below are specified.
 *
 * - Accent swapped to Spotify green (#1DB954), with black on-accent text
 *   to match Spotify's own button styling.
 * - Typography is left as Neutral's default (Figtree, falling back to the
 *   system font stack since Figtree isn't loaded) — no brand requirement
 *   on typeface.
 */

import { defineTheme } from "@astryxdesign/core/theme";
import { neutralIconRegistry, neutralTheme } from "@astryxdesign/theme-neutral";

export const spotifyTheme = defineTheme({
  name: "spotify",
  extends: neutralTheme,
  // `extends` merges tokens/components automatically, but `astryx theme
  // build` can't serialize a live icon registry through an inherited
  // `extends` base — it has to be passed explicitly here.
  icons: neutralIconRegistry,

  tokens: {
    // Same hex in both modes to match the app's established branding.
    "--color-accent": ["#1DB954", "#1DB954"],
    "--color-accent-muted": ["#1DB95426", "#1DB95433"],
    "--color-text-accent": ["#1DB954", "#1DB954"],
    "--color-icon-accent": ["#1DB954", "#1DB954"],
    "--color-on-accent": ["#000000", "#000000"],
  },
});
