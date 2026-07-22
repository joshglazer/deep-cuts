# CLAUDE

Project-specific guidance for AI coding agents.

## Code comments: only the non-obvious

Don't add a comment unless it explains something a reader can't already get
from the variable/function names and the code itself — a hidden constraint,
an external API quirk, or the reason a fallback/dedup/guard clause exists.
If a comment just restates what the next line does (e.g. `/** Played track
ids for a user, scoped to a single album. */` above
`getPlayedTrackIds(spotifyUserId, spotifyAlbumId)`), delete it rather than
leave it as filler. When trimming an existing comment, keep the "why" clause
and cut the "what" clause rather than deleting the whole thing.

## Component props: don't add one until a caller needs it

Don't add a prop "for flexibility" or "in case a future caller wants it" —
add it when a real call site actually needs to pass a non-default value. A
prop whose default is never overridden anywhere in the codebase is dead
code wearing a public API: it widens the component's surface and has to be
read and reasoned about on every future edit, and the type checker won't
flag it since it's still a valid, merely-unused signature.

For example, `SortSelect` grew an `isLabelHidden` prop while building the
list filter popover, on the assumption the popover would want the
control's built-in label visible. The popover ended up placing an external
`Text` label next to the control instead (so the label column could stay a
fixed width across rows), so every call site kept relying on
`isLabelHidden`'s default — the prop was dead from the moment it landed,
and only caught when someone asked "is this still needed?" Before adding a
prop, check whether an existing call site actually needs to pass something
other than the default; if not, hardcode the behavior and add the prop
later, in the same change that introduces the caller that needs it.

## Component props: name the type `<Component>Props`

Every component that takes a props parameter gets a dedicated type or
interface named after the component plus a `Props` suffix — e.g.
`AlbumRow`'s props are typed `AlbumRowProps`, `PageShell`'s are
`PageShellProps`. Declare it just above the component and pass it as the
parameter's type annotation, rather than inlining an anonymous `{ ... }`
object type in the function signature. This applies to page/layout
components too (`ListPage` → `ListPageProps`, `RootLayout` →
`RootLayoutProps`), not just `src/design/**` and `src/components/**`.
Components that take no props (e.g. `Logo`, `Footer`) don't need one.

Don't export the type by default — only add `export` when another file
actually needs to import it (e.g. to reference a sub-shape like
`AlbumRowProps["progress"]`), same as the "don't add a prop until a caller
needs it" rule above applied to the type itself.

This keeps the props shape nameable and gives a single, greppable spot to
read a component's public API instead of hunting for an inline type buried
in the function signature.

Destructure props against `Readonly<XProps>`, not `XProps`, in the
function signature — e.g. `function AlbumRow({ name, ... }: Readonly<AlbumRowProps>)`.
A component that mutates or reassigns one of its own props is almost
always a bug (React re-renders from the parent's data, so a locally
mutated prop gets silently overwritten and masks what should be local
state instead); `Readonly<>` makes the type checker catch that at the
assignment site rather than relying on convention.

## One component per file

Every component — including small local helpers that only exist to be used
once inside another component — gets its own file, named after the
component. Don't define a second component (even an unexported one) further
down in a file that already exports one. For example, `FilterPopover`'s
label column was originally a local `FilterRow` function declared above
`FilterPopover` in the same file; it moved to its own `FilterRow.tsx` even
though `FilterPopover` is its only caller. This keeps every file greppable
by its one component's name, keeps diffs scoped to the component that
actually changed, and avoids the ambiguity of which of two components in a
file a given import statement is pulling in.

## Local dev server: always use 127.0.0.1, never localhost

Spotify's OAuth no longer allows `localhost` as a redirect URI hostname, and
the app's session cookie is scoped to whichever host you loaded the page
from — so browsing to `localhost:3000` after signing in on `127.0.0.1:3000`
(or vice versa) silently loses the session and bounces you back to the
sign-in page. Always address the dev server as `http://127.0.0.1:3000`, not
`http://localhost:3000` — in curl commands, browser preview/navigate tools,
and any `AUTH_URL`/redirect URI references.

## AWS spend: keep it minimal, always consider cost

This project runs on AWS Amplify (see the `AWS_PROFILE=deep-cuts` /
`d213vwy4ydt1` app referenced in memory) and is a small personal project, not
production infrastructure with a real budget. Treat AWS cost as a hard
constraint on every suggestion or action that touches AWS, not just a nice-to-have:

- Never suggest or provision architecture that risks a large or unbounded
  spend spike — no always-on compute sized for scale this app doesn't have
  (e.g. provisioned-concurrency Lambdas, NAT gateways, RDS/Aurora clusters,
  OpenSearch/Elasticsearch domains, Kinesis, multi-AZ redundancy "for safety"),
  no uncapped autoscaling, no enabling detailed/long-retention logging or
  tracing (X-Ray, verbose CloudWatch Logs) without a retention policy, and no
  services billed per-request/per-GB at meaningful volume without first
  estimating the cost.
- Prefer the cheapest tier that satisfies the requirement: on-demand/serverless
  over provisioned, pay-per-request DynamoDB over provisioned capacity,
  shortest reasonable log retention, and turning off/deleting resources that
  are no longer needed (e.g. stopping an `ampx sandbox` you're done with)
  rather than leaving them running.
- Before running any AWS CLI/console action that creates, resizes, or
  configures a billable resource, briefly note the expected cost impact to the
  user. If a change could plausibly cause a noticeable spend increase, flag it
  explicitly and ask before proceeding, even if the action itself isn't in the
  "explicit permission required" category above.
- If asked to design a new feature that needs AWS infrastructure, default to
  the lowest-cost serverless option (Amplify-managed resources, Lambda,
  DynamoDB on-demand, S3) and call out cheaper alternatives if the user's
  request implies something heavier.

## Previewing in a git worktree: run `npm run sandbox` first

`src/lib/amplify-server.ts` imports `amplify_outputs.json`, which is
generated by the Amplify sandbox and is git-ignored. `.worktreeinclude`
carries it (along with `.env.local` and `.amplify/`) into freshly created
worktrees, but that's a one-time snapshot from whichever worktree it was
copied from — not a live sync. As soon as you touch `amplify/**` in your own
worktree, run `npm run sandbox` (`ampx sandbox --profile deep-cuts`) and
leave it running in the background so `amplify_outputs.json` stays in sync
with your schema changes. Without it, any page that touches `dataClient`
(e.g. `/list`, `/list/artist/[artistId]`) fails to compile with `Module not
found: Can't resolve '../../amplify_outputs.json'` if the file is ever
missing outright.

## Budget kill switch: extend it when adding a new AWS service

Account `194089666599` has a $50/month budget with an automated kill
switch attached (full detail in README.md, "Cost controls: the $50 budget
kill switch") — when spend hits $50, a Lambda function
(`deep-cuts-budget-kill-switch`, source at
`scripts/kill-switch-lambda/index.py`) zeros all Lambda concurrency,
disables all EventBridge schedules, locks all S3 buckets, and blocks all
AppSync APIs via WAF, account-wide.

It covers those four service types *dynamically* — new Lambda functions,
buckets, schedules, or AppSync APIs are picked up automatically, no
changes needed. It does **not** cover any other AWS service. If you add a
resource from a service the kill switch doesn't already touch — RDS, EC2,
CloudFront, SQS, Cognito, Bedrock, a REST API Gateway, anything outside
Lambda/EventBridge Scheduler/S3/AppSync — that resource will keep running
(and keep costing money) through a firing unless you extend the kill
switch as part of that change:

1. Add a step to `scripts/kill-switch-lambda/index.py` that stops/blocks
   the new resource type (list existing steps there for the pattern: dry
   run support, per-resource try/except, results dict).
2. Add whatever IAM actions that step needs to
   `scripts/kill-switch-lambda/permissions.json`.
3. Run `scripts/kill-switch-deploy.sh` to push both — editing these files
   alone does nothing live until that runs.
4. Verify with a dry-run invoke (`{"dry_run": true}` payload) before
   trusting it.

Treat this the same way as any other cross-cutting concern: if a task adds
a new AWS service to this project, extending the kill switch is part of
that task, not a follow-up to skip.

**Don't point `scripts/kill-switch-undo.py` at the `deep-cuts` profile.**
It defaults to `deep-cuts-breakglass` on purpose — `deep-cuts` assumes
`OrganizationAccountAccessRole`, which is the exact role the kill switch's
IAM deny action locks, so a recovery script running as `deep-cuts` would be
blocked by the thing it's meant to undo. `deep-cuts-breakglass` is a
separate IAM user (`DeepCutsBreakGlassRecovery`) carrying only the narrow
permissions that script needs, immune to that deny by construction. If you
add new undo logic that needs a permission the break-glass user doesn't
have, extend its policy (attached via `iam put-user-policy`, not committed
as a file anywhere — check current permissions with `aws iam
list-user-policies` / `get-user-policy` against that user) rather than
switching the script back to `deep-cuts`.

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

## Tests: assert on mock calls with matchers, not raw `.mock.calls[n]` indexing

Don't reach into `someMock.mock.calls[0][0]` (or `[1][1]`, etc.) to assert
on a mock's arguments — it reads as noise (which call? which argument?) and
gives no useful failure message when it's wrong. Use the matcher that says
what you actually mean:

- Checking the most recent (or only) call: `expect(fn).toHaveBeenLastCalledWith(...)`.
- Checking a call at a specific position when a mock is called more than
  once with different args (e.g. a token-fetch call followed by the real
  request, as in `spotify.test.ts`) — `expect(fn).toHaveBeenNthCalledWith(1, ...)` /
  `toHaveBeenNthCalledWith(2, ...)` rather than indexing `.mock.calls[0]` /
  `.mock.calls[1]` by hand.
- Partial-match a single argument (e.g. a URL you only care contains a
  query string, not the full string) — pass `expect.stringContaining(...)`
  as that argument to the matcher above, instead of extracting the raw
  value and calling `.toContain()` on it separately.

Only fall back to extracting a call's arguments manually (e.g.
`const [request] = fn.mock.lastCall;`) when you need to inspect a
*property* of an argument rather than assert the whole argument's value —
e.g. `route.test.ts` destructures `Auth.mock.lastCall` to read the
forwarded request's rewritten `url`, since the whole `Request` object
isn't meaningfully comparable with a matcher (two `Request`s with
identical content still aren't recognized as equal). Even then, use
`.mock.lastCall` (or `.mock.calls.at(-1)`) over `.mock.calls[0]` so the
intent — "the most recent call" — is in the code, not implied by a magic
index that only happens to mean "most recent" because there's just one call.

## Tests: don't add `beforeEach(() => vi.clearAllMocks())` — it's global

`vitest.config.ts` sets `test.clearMocks: true`, which runs
`vi.clearAllMocks()` before every test automatically, repo-wide. Don't add
a per-file `beforeEach(() => { vi.clearAllMocks(); })` — it's dead weight
that duplicates what the config already does for every test, in every
file, unconditionally. If a `beforeEach` in a test file needs to do other
setup (e.g. `vi.setSystemTime(...)` in `statsData.test.ts`), that setup
still belongs in a `beforeEach`, just without a `vi.clearAllMocks()` line
alongside it — the global config hook runs before it either way, so
mocks are already clear by the time any file-level `beforeEach` runs.

This only clears call history (`.mock.calls`/`.mock.results`/etc.), not
configured behavior — a `vi.fn().mockResolvedValue(...)` set inside an
`it()` block still works normally, since that runs after the automatic
clear, not before it. If a future need calls for also resetting mock
*implementations* between tests (not just call history), that's
`test.mockReset` — a different, stronger config option — not a reason to
reintroduce manual `vi.clearAllMocks()`/`vi.resetAllMocks()` calls in
individual files.

## Tests: `@/lib/amplify-server` is already mocked globally — don't re-mock it

`vitest.setup.ts` calls `vi.mock("@/lib/amplify-server", ...)` once, for
every test file, rather than each file that touches `dataClient` mocking
it individually. Two reasons this lives in setup rather than per-file: it
cuts the repeated boilerplate, and — more importantly — it means a new
test file that transitively imports something depending on `dataClient`
(directly, or via e.g. `actions.ts`/`listenProgress.ts`) can't forget to
mock it and crash with `Cannot resolve '../../amplify_outputs.json'` (that
file only exists after `npm run sandbox`, never in CI). Vitest's per-file
module isolation means each test file still gets its own fresh mock
instance — no state leaks between files, same as when each file created
its own.

To use it in a test file, don't call `vi.mock("@/lib/amplify-server", ...)`
yourself — just import the (already-mocked) binding and cast it to
configure return values:

```ts
import { dataClient } from "@/lib/amplify-server";
import type { MockDataClient } from "@/test/mockDataClient";

const mockDataClient = dataClient as unknown as MockDataClient;
// mockDataClient.models.Album.list.mockResolvedValue({ data: [...] });
```

The cast is necessary (not a style choice) — `dataClient`'s real type
comes from the generated Amplify client, which has no `.mockResolvedValue`
etc.; at runtime it's the mock object from `src/test/mockDataClient.ts`,
just not typed that way through the real module's type signature.

## Tests: `@/auth` doesn't resolve under Vitest — mock it per-file, not globally

`@/auth` pulls in `next-auth`, whose `next-auth/lib/env.js` imports
`next/server` in a way Vitest can't resolve — any test file that
transitively imports `@/auth` (directly, or via e.g. `actions.ts`,
`TrackResetButton.tsx`) without mocking it crashes the *whole file* before
a single test runs: `Cannot find module '.../next/server' imported from
.../next-auth/lib/env.js`. Verified directly: removing the `@/auth` mock
from a test that needs it fails with exactly that error, and mocking only
the specific export actually used (e.g. `requireSpotifyUserIdOrThrow`)
fixes it — confirming the module resolution itself is the blocker, not
anything about the mocked behavior underneath it.

Unlike `@/lib/amplify-server`, don't move this to a single global
`vi.mock("@/auth", ...)` in `vitest.setup.ts` — `auth.test.ts` tests the
real module, so a global mock would make that impossible, and different
callers need different subsets of `@/auth`'s surface
(`requireSpotifyUserIdOrRedirect`, `requireSpotifyUserIdOrThrow`,
`requireSignedIn`, `auth`, `signIn`, `signOut`, `previewLoginEnabled`,
`authConfig`) mocked with different behavior. Mock only what that file's
code path actually calls, e.g.:

```ts
const requireSpotifyUserIdOrThrow = vi.fn();
vi.mock("@/auth", () => ({ requireSpotifyUserIdOrThrow }));
```

This is also why `AlbumRowActionMenu.test.tsx`/`AlbumList.test.tsx`/
`TrackResetButton.test.tsx` mock the whole `./actions` module rather than
just `@/auth`: `actions.ts` re-exports functions that call
`requireSpotifyUserIdOrThrow` internally, so mocking `@/auth` alone would
still require mocking further into `actions.ts`'s own `dataClient` calls
to get a component test running — mocking the action function directly is
both simpler and keeps the test scoped to what that component owns
(does it call the action with the right args), not `actions.ts`'s own
behavior (already covered by `actions.test.ts`).

## Tests: don't mock a child component without a specific, checkable reason

Default to rendering a component's real children — mocking a child (`vi.mock("./Header", ...)`,
stubbing it out to a `<div />`) trades a test that exercises real behavior
for one that only proves your mock was wired up correctly. Reach for it
only when there's a concrete blocker, and name that blocker in a comment
next to the `vi.mock` call — "avoids re-testing X, which has its own test"
is not by itself a reason to mock (that's true of nearly every child and
would justify mocking everything).

Reasons that *do* hold up, seen so far in this codebase:

- **The child is an async Server Component embedded as JSX.** `Header`
  and `Footer` are `export async function Header() { ... }`, called
  directly by `PageShell` as `<Header />`. Client-side React (what
  `@testing-library/react` renders through) cannot execute an async
  function component inline in a tree — it throws `"<Header> is an async
  Client Component. Only Server Components can be async at the moment"`
  and **aborts the entire render**, not just that subtree (verified: a
  `PageShell` test with a real, unmocked `Header` renders nothing at all,
  not even `PageShell`'s own title). This only applies when the async
  component is invoked as JSX by another component under test. If the
  async component itself *is* the thing under test, don't mock it — call
  it directly and await it instead: `render(await Header())` (see
  `Header.test.tsx`, `Footer.test.tsx`), which sidesteps the problem
  entirely and exercises the real component.
- **The child has an unrelated, verified defect that crashes rendering.**
  `AlbumSearch.test.tsx` mocks `@/design/atoms/Button` because Astryx's
  `Button` calls its own internal `useTransition()`, which deterministically
  crashes React's dev-mode hook-count check when mounted under a parent
  whose own `useTransition` drives that `Button`'s `isLoading` prop —
  confirmed in isolation, unrelated to how the test renders it. `Button`
  keeps its own coverage elsewhere (`SegmentedControl.test.tsx`,
  `AddableAlbumList.test.tsx`), so this only routes around the crash
  rather than skipping coverage of `Button` itself.

If you hit a case that doesn't fit either pattern above, don't reach for
`vi.mock` on a child component reflexively — reproduce the actual failure
first (render it for real, see what breaks), and only mock once that
failure is understood and can't be fixed a different way (e.g. calling an
async component directly instead of embedding it, per the first bullet).
