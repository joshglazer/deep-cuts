# CLAUDE

Project-specific guidance for AI coding agents.

## Local dev server: always use 127.0.0.1, never localhost

Spotify's OAuth no longer allows `localhost` as a redirect URI hostname, and
the app's session cookie is scoped to whichever host you loaded the page
from — so browsing to `localhost:3000` after signing in on `127.0.0.1:3000`
(or vice versa) silently loses the session and bounces you back to the
sign-in page. Always address the dev server as `http://127.0.0.1:3000`, not
`http://localhost:3000` — in curl commands, browser preview/navigate tools,
and any `AUTH_URL`/redirect URI references.

<!-- ASTRYX:START -->
Astryx v0.1.4 · 149 components
CLI: run every command as `npx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing. Full page → AppShell; sidebar nav → SideNav.
- Frame first: pick the shell (AppShell / Layout+LayoutPanel) and budget regions in px BEFORE writing content (`astryx docs layout`).
- Dense data = rows (Table, List/Item) edge-to-edge — never Card-wrapped list items. Card = dashboard widgets, galleries, settings groups only.
- Status → StatusDot/Token; Badge only for counts and enumerated states, never decoration.
- Custom styling: component props first; else Tailwind utilities backed by tokens (bg-surface, text-primary, rounded-lg) via tailwind-theme.css. No raw hex/px.
- Tokens for every value (`astryx docs tokens`). Brand/accent via `astryx theme` — never override --color-* in :root.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   149 components by category
  template --list    page + block recipes
  docs <topic>       color, elevation, icons, illustrations, layout, migration, motion, principles, shape, spacing, styling, theme, tokens, typography
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->

Note: ignore the generic "SETUP" step above (importing reset.css/astryx.css in a JS
entry file) — this project wires those imports through `src/app/globals.css`'s
cascade-layer chain instead (see below). Don't add a second copy in a component.

## Deep Cuts design system architecture

This app enforces a strict boundary: **Astryx components may only be imported
inside `src/design/`.** Everything else — pages, `src/components/**`, features —
must import the specific file that wraps what they need. This is enforced by a
`no-restricted-imports` ESLint rule in `eslint.config.mjs` (scoped to `src/**`,
excluding `src/design/**`); an `@astryxdesign/*` import anywhere else is a lint
error, not a style suggestion.

**No barrel files.** `src/design/` intentionally has no `index.ts` anywhere —
not at the root, not in `atoms/`, not in `molecules/`. Import each piece from
its own file, e.g. `import { Button } from "@/design/atoms/Button"` and
`import { AlbumRow } from "@/design/molecules/AlbumRow"`, not from `@/design`
or `@/design/atoms`. Don't reintroduce an aggregating `index.ts` — it was
removed on purpose (Next.js/Turbopack barrel files force loading the whole
module graph behind them, which was also making dev-mode compiles slower
here).

Layout of `src/design/`:
- `atoms/` — one file per curated Astryx primitive re-export (`Button.ts`,
  `Text.ts`, `Heading.ts`, `Link.ts`, `Thumbnail.ts`, `Badge.ts`,
  `EmptyState.ts`, `Banner.ts`, `TextInput.ts`, `IconButton.ts`, ...). Adding a
  new Astryx component to the app means adding a new file here first, named to
  match the export.
- `atoms/Stack.tsx` — wraps Astryx's `HStack`/`VStack` to replace the numeric
  `gap` prop (`SpacingStep`, e.g. `gap={4}`) with a 3-step preset scale:
  `gap="sm" | "md" | "lg"` (mapped to spacing steps 2/4/6 in `GAP_SCALE`).
  Use these presets instead of numeric gaps at call sites — it's the one atom
  that isn't a thin re-export, so don't import `HStack`/`VStack` from
  `@astryxdesign/core/Stack` directly even from elsewhere in `src/design`.
- `molecules/` — small composed patterns reused across features (e.g.
  `AlbumRow.tsx` = Thumbnail + Text + action slot), one file per molecule.
  Promote a repeated 2+ atom composition into a molecule rather than
  duplicating it at call sites.
- Add an `organisms/` folder only if a reusable multi-molecule composition
  emerges. App-specific composition (data fetching, server actions, routing)
  stays in `src/app/**` / `src/components/**`, which import straight from the
  relevant `src/design/**` file.
- `theme/spotifyTheme.ts` — `defineTheme({ extends: neutralTheme, ... })`,
  where `neutralTheme` is imported straight from `@astryxdesign/theme-neutral`.
  `extends` merges the base theme's tokens/components/icons at lowest
  precedence, so this file only lists the actual delta: Spotify green accent +
  black on-accent text. Typography is left as Neutral's default (Figtree,
  falling back to the system font stack) — the app has no brand requirement on
  typeface, so there's nothing to override there.
  Icons are re-passed explicitly (`icons: neutralIconRegistry`, also imported
  from `@astryxdesign/theme-neutral`) because `astryx theme build` can't
  serialize a live icon registry through an inherited `extends` base — leaving
  that line out silently drops all icons from the built theme.
  **Don't fork the base theme's source** (`astryx theme add`) to make small
  brand tweaks — `extends` gets the same result from a handful of lines
  instead of ~600, and stays in sync with upstream token/component changes on
  `astryx upgrade`. Prefer direct `tokens` overrides over the higher-level
  `typography`/`color` config helpers when the values you'd pass would just
  restate what the base theme already sets — diff the built CSS to confirm
  before assuming a config block is doing something. After editing this file,
  run `npm run design:theme` to recompile `spotify-theme.css` and the built
  `spotify.js`/`.d.ts`; those generated files are committed, so don't
  hand-edit them directly.
- `DesignProvider.tsx` — wraps the app in `<Theme theme={spotifyTheme}>` +
  `<LinkProvider component={NextLink}>`, mounted once in `src/app/layout.tsx`.
  Don't add a second `<Theme>` elsewhere unless a specific region genuinely
  needs a different theme.

The app has no custom font loading — `layout.tsx` does not call `next/font`,
and `globals.css` has no `--font-sans`/`--font-mono` mapping. Everything
renders in whatever `spotifyTheme` resolves (Neutral's Figtree → system font
fallback). If a real typeface is wanted later, load it via `next/font` in
`layout.tsx` and set `--font-family-body`/`--font-family-heading`/
`--font-family-code` in `spotifyTheme.ts`'s `tokens`, not by adding raw
`font-family` CSS elsewhere.

Tailwind coexists with Astryx via cascade layers declared at the top of
`src/app/globals.css` (`@layer reset, theme, base, astryx-base, astryx-theme,
components, utilities`) — Tailwind utilities always win. Passing
`className="..."` to any `@/design` component for one-off spacing/layout is
safe and expected; hardcoding colors that way is not — use theme tokens
(`bg-surface`, `text-primary`, etc., bridged via `tailwind-theme.css`) or
`variant`/`color` props instead.
