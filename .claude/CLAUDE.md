# CLAUDE

Project-specific guidance for AI coding agents.

## Components

### Comments: only the non-obvious

Only add a comment when it explains something the code and names can't —
a hidden constraint, an external API quirk, or why a fallback/dedup/guard
clause exists. Delete comments that just restate the next line (e.g. a
`/** Played track ids for a user, scoped to a single album. */` above
`getPlayedTrackIds(spotifyUserId, spotifyAlbumId)` is filler). When
trimming an existing comment, keep the "why" and cut the "what" rather
than deleting it outright.

### Props: add only when a caller needs it

Don't add a prop "for flexibility" — add it when a real call site needs a
non-default value. An unused prop is dead code that still has to be read
on every future edit, and the type checker won't catch it. Example:
`SortSelect` grew an `isLabelHidden` prop anticipating a use case that
never arrived (the popover ended up placing its own `Text` label
instead), so the prop sat dead until someone asked "is this still
needed?" Check whether an existing call site actually needs a non-default
value before adding a prop; add it later, alongside the caller that needs
it.

### Props: name the type `<Component>Props`

Every component that takes props gets a dedicated type declared just
above it and named `<Component>Props` (e.g. `AlbumRowProps`,
`PageShellProps`, `ListPageProps`) — including page/layout components,
not just `src/design/**`/`src/components/**`. Don't inline an anonymous
object type in the signature. Only `export` the type if another file
needs to import it (e.g. a sub-shape like `AlbumRowProps["progress"]`).
Components with no props (`Logo`, `Footer`) don't need one.

Destructure against `Readonly<XProps>`, not `XProps` — a component that
mutates its own props is almost always a bug (the parent's next render
silently overwrites the mutation), and `Readonly<>` catches that at the
assignment site.

### One component per file

Every component — including small local helpers used only once inside
another component — gets its own file, named after the component (e.g.
`FilterPopover`'s label column moved out to its own `FilterRow.tsx` even
though `FilterPopover` is its only caller). Keeps files greppable by
component name and diffs scoped to what actually changed.

## Design system (`src/design/`, Astryx)

Astryx components may only be imported inside `src/design/` — everywhere
else (pages, `src/components/**`, features) imports the specific
`src/design/**` file that wraps what it needs. Enforced by a
`no-restricted-imports` ESLint rule in `eslint.config.mjs`; an
`@astryxdesign/*` import outside `src/design/**` is a lint error.

**No barrel files** — `src/design/` has no `index.ts` anywhere (root,
`atoms/`, `molecules/`). Import each piece from its own file
(`@/design/atoms/Button`, `@/design/molecules/AlbumRow`), never from
`@/design` or `@/design/atoms`. This was removed on purpose — barrel
files force Turbopack to load the whole module graph behind them, which
was slowing dev-mode compiles.

Layout:
- `atoms/` — one file per curated Astryx primitive re-export. Adding a
  new Astryx component to the app means adding a file here first.
- `atoms/Stack.tsx` — wraps `HStack`/`VStack`, replacing the numeric
  `gap` prop with a 3-step scale: `gap="sm" | "md" | "lg"` → spacing
  steps 2/4/6. Use these presets rather than importing `HStack`/`VStack`
  directly, even elsewhere in `src/design`.
- `molecules/` — composed patterns reused across features (e.g.
  `AlbumRow.tsx` = Thumbnail + Text + action slot), one file per
  molecule. Promote a repeated 2+ atom composition here instead of
  duplicating it.
- `organisms/` — add only if a reusable multi-molecule composition
  emerges. App-specific composition (data fetching, server actions,
  routing) stays in `src/app/**`/`src/components/**`.
- `theme/spotifyTheme.ts` — `defineTheme({ extends: neutralTheme, ... })`;
  only lists the delta from Neutral (Spotify green accent, black
  on-accent text). Icons are re-passed explicitly (`icons:
  neutralIconRegistry`) because `astryx theme build` can't serialize an
  inherited icon registry through `extends` — omitting it silently drops
  all icons. Don't fork the base theme (`astryx theme add`) for small
  tweaks; prefer `extends` and direct `tokens` overrides (diff the built
  CSS before assuming a `typography`/`color` helper is doing something).
  After editing, run `npm run design:theme` to recompile
  `spotify-theme.css`/`spotify.js` — those generated files are
  committed, don't hand-edit them.
- `DesignProvider.tsx` — wraps the app in `<Theme theme={spotifyTheme}>`
  + `<LinkProvider component={NextLink}>`, mounted once in
  `src/app/layout.tsx`. Don't add a second `<Theme>` unless a specific
  region genuinely needs a different one.

No custom font loading — `layout.tsx` has no `next/font` call, and
`globals.css` has no `--font-sans`/`--font-mono` mapping; everything
renders in Neutral's default (Figtree → system fallback). To add a real
typeface later, load it via `next/font` in `layout.tsx` and set
`--font-family-*` in `spotifyTheme.ts`'s `tokens`, not raw CSS elsewhere.

Tailwind coexists via cascade layers declared at the top of
`globals.css` (`@layer reset, theme, base, astryx-base, astryx-theme,
components, utilities`) — Tailwind utilities always win. `className="..."`
on any `@/design` component for one-off spacing/layout is safe;
hardcoding colors that way is not — use theme tokens (`bg-surface`,
`text-primary`, via `tailwind-theme.css`) or `variant`/`color` props
instead.

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
cascade-layer chain instead (see above). Don't add a second copy in a component.

## Testing

### Assert on mock calls with matchers, not raw indexing

Don't reach into `someMock.mock.calls[0][0]` — use the matcher that says
what you mean:
- Most recent/only call: `toHaveBeenLastCalledWith(...)`.
- A specific call among several (e.g. a token fetch followed by the real
  request): `toHaveBeenNthCalledWith(1, ...)` / `(2, ...)`.
- Partial match one argument: pass `expect.stringContaining(...)` into
  the matcher rather than extracting the value and calling `.toContain()`.

Only extract a call's arguments manually when you need a *property* of
an argument rather than the whole value — e.g. `route.test.ts` reads
`Auth.mock.lastCall` to check a rewritten `url`, since two `Request`
objects with identical content aren't `.toEqual()`-comparable. Even then,
use `.mock.lastCall` (or `.mock.calls.at(-1)`), not `.mock.calls[0]`, so
"most recent call" is explicit rather than implied by an index that
happens to be the only one.

### Don't manually clear mocks — it's global

`vitest.config.ts` sets `test.clearMocks: true`, which runs
`vi.clearAllMocks()` before every test repo-wide. Don't add a per-file
`beforeEach(() => vi.clearAllMocks())` — it's redundant. A `beforeEach`
that needs other setup (e.g. `vi.setSystemTime(...)`) can still exist,
just without a `clearAllMocks()` line. This only clears call history,
not configured behavior — `vi.fn().mockResolvedValue(...)` set inside an
`it()` still works, since it runs after the automatic clear.

### `@/lib/amplify-server` is already mocked globally

`vitest.setup.ts` calls `vi.mock("@/lib/amplify-server", ...)` once for
every test file, so a new test that transitively imports something
touching `dataClient` can't forget to mock it and crash on
`amplify_outputs.json` (which only exists after `npm run sandbox`, never
in CI). Vitest's per-file isolation still gives each file its own mock
instance. To use it, don't re-mock — import the binding and cast it:

```ts
import { dataClient } from "@/lib/amplify-server";
import type { MockDataClient } from "@/test/mockDataClient";
const mockDataClient = dataClient as unknown as MockDataClient;
```

The cast is required — `dataClient`'s real type comes from the generated
Amplify client and has no `.mockResolvedValue`; at runtime it's the mock
from `src/test/mockDataClient.ts`.

### `@/auth` needs a per-file mock

`@/auth` pulls in `next-auth`, whose `next-auth/lib/env.js` imports
`next/server` in a way Vitest can't resolve — any test file that
transitively imports `@/auth` without mocking it crashes the whole file
before any test runs. Unlike `amplify-server`, don't move this to a
global mock — `auth.test.ts` tests the real module, and different
callers need different subsets mocked. Mock only what the file's code
path calls:

```ts
const requireSpotifyUserIdOrThrow = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrThrow }));
```

This is also why `AlbumRowActionMenu.test.tsx`/`AlbumList.test.tsx`/
`TrackResetButton.test.tsx` mock the whole `./actions` module instead —
`actions.ts` calls `requireSpotifyUserIdOrThrow` internally, so mocking
`@/auth` alone would still require mocking further into `actions.ts`'s
own `dataClient` calls.

### Don't mock a child component without a specific reason

Default to rendering real children. Reach for `vi.mock` on a child only
for a concrete blocker, named in a comment next to the call — "it has
its own test" is not a reason (true of nearly every child). Reasons that
hold up so far:
- **The child is an async Server Component embedded as JSX.**
  Client-side React can't render an async function component inline —
  it throws and aborts the *whole* tree, not just that subtree (verified:
  `PageShell` with a real `Header` renders nothing at all). Only applies
  when the async component is invoked as JSX by the component under
  test — if the async component itself is under test, call it directly
  instead: `render(await Header())`.
- **The child has an unrelated, verified defect that crashes rendering.**
  `AlbumSearch.test.tsx` mocks `@/design/atoms/Button` because its
  internal `useTransition()` deterministically crashes React's dev-mode
  hook-count check when mounted under a parent whose own `useTransition`
  drives that `Button`'s `isLoading` prop — confirmed in isolation.
  `Button` keeps coverage elsewhere (`SegmentedControl.test.tsx`,
  `AddableAlbumList.test.tsx`).

If a case doesn't fit either pattern, reproduce the failure for real
before mocking — don't reach for `vi.mock` reflexively.

## AWS & infrastructure

### Local dev: 127.0.0.1, not localhost

Spotify OAuth rejects `localhost` as a redirect URI host, and the
session cookie is scoped to whichever host you loaded the page from —
switching between `localhost:3000` and `127.0.0.1:3000` silently loses
the session. Always use `http://127.0.0.1:3000` (curl, browser tools,
`AUTH_URL`/redirect URIs).

### Keep AWS spend minimal

This runs on AWS Amplify (`AWS_PROFILE=deep-cuts`, app `d213vwy4ydt1`) as
a small personal project, not production infra with a real budget. On
anything AWS-touching:
- No architecture that risks a spend spike — no always-on/provisioned
  compute sized for scale this app doesn't have (provisioned-concurrency
  Lambdas, NAT gateways, RDS/Aurora, OpenSearch, Kinesis, multi-AZ "for
  safety"), no uncapped autoscaling, no verbose/long-retention
  logging/tracing without a retention policy.
- Prefer the cheapest tier: on-demand/serverless, pay-per-request
  DynamoDB, short log retention; turn off/delete resources no longer
  needed (e.g. stop an `ampx sandbox` when done).
- Before any AWS CLI/console action that creates/resizes/configures a
  billable resource, note the expected cost impact; flag and ask first
  if it could plausibly cause a noticeable spend increase.
- New features needing AWS infra default to the lowest-cost serverless
  option (Amplify-managed, Lambda, DynamoDB on-demand, S3).

### Worktrees: run `npm run sandbox` first

`src/lib/amplify-server.ts` imports `amplify_outputs.json`, generated by
the Amplify sandbox and git-ignored. `.worktreeinclude` carries a
one-time snapshot of it into new worktrees — not a live sync. As soon as
you touch `amplify/**` in your own worktree, run `npm run sandbox`
(`ampx sandbox --profile deep-cuts`) and leave it running so the file
stays in sync. Without it, any page touching `dataClient` (`/list`,
`/list/artist/[artistId]`) fails to compile with `Module not found`.

### Budget kill switch

Account `194089666599` has a $50/month budget with an automated kill
switch (full detail in README.md, "Cost controls: the $50 budget kill
switch") — at $50 spend, a Lambda (`deep-cuts-budget-kill-switch`,
source `scripts/kill-switch-lambda/index.py`) zeros Lambda concurrency,
disables EventBridge schedules, locks S3 buckets, and blocks AppSync via
WAF, account-wide.

It covers Lambda/EventBridge/S3/AppSync *dynamically* — new resources of
those types need no changes. Any other service (RDS, EC2, CloudFront,
SQS, Cognito, Bedrock, API Gateway, ...) keeps running through a firing
unless extended as part of the same change:
1. Add a step to `scripts/kill-switch-lambda/index.py` (see existing
   steps for the pattern: dry-run support, per-resource try/except,
   results dict).
2. Add the needed IAM actions to
   `scripts/kill-switch-lambda/permissions.json`.
3. Run `scripts/kill-switch-deploy.sh` — editing the files alone doesn't
   deploy anything.
4. Verify with a dry-run invoke (`{"dry_run": true}`) before trusting it.

**Don't point `scripts/kill-switch-undo.py` at the `deep-cuts` profile**
— it defaults to `deep-cuts-breakglass` on purpose. `deep-cuts` assumes
`OrganizationAccountAccessRole`, the exact role the kill switch's IAM
deny locks, so recovery running as `deep-cuts` would be blocked by the
thing it's undoing. `deep-cuts-breakglass` (IAM user
`DeepCutsBreakGlassRecovery`) carries only the narrow permissions the
script needs. If new undo logic needs a permission that user lacks,
extend its policy (via `iam put-user-policy`, not committed as a file —
check current permissions with `aws iam list-user-policies`/
`get-user-policy`) rather than switching back to `deep-cuts`.
