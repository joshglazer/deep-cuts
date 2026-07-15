# Deep Cuts

Queue up artists and albums to listen to on Spotify, then track whether you
actually got around to them.

## Architecture

- **Frontend + API**: Next.js (App Router), deployed on **AWS Amplify
  Hosting**. There's no separate backend service — server components, server
  actions, and route handlers under `src/app/` are the backend.
- **Auth**: [Auth.js](https://authjs.dev) (`src/auth.ts`) against Spotify's
  OAuth. Signing in *is* connecting your Spotify account — there's no
  separate login system.
- **Data**: DynamoDB, provisioned and queried through **Amplify Gen 2
  Data** (`amplify/data/resource.ts`) rather than the raw AWS SDK — it gives
  a typed client, and handles the AppSync/DynamoDB wiring for you. See the
  model definitions there for `Artist`, `Album`, and `ListenEvent`.
- **Listen tracking**: `amplify/functions/poll-spotify` is a scheduled
  Lambda (every 15 min) that refreshes each connected user's Spotify access
  token (the refresh token is persisted to the `SpotifyAuth` model on
  sign-in/refresh — see `src/auth.ts` — since the function runs with no user
  session of its own), polls their "recently played" history, and records
  matches against their queue as `ListenEvent`s. Spotify has no push/webhook
  API for this, so polling is the only option. The queue pages read those
  `ListenEvent`s back to show a per-album progress bar ("x/y tracks") and
  per-track played checkmarks on the album's track list.

Why these choices: see the cost/architecture discussion earlier in this
project's history. Short version — Amplify Hosting + DynamoDB is pay-per-use
with no fixed floor, and realistically free at personal-project scale.

## Prerequisites

- An AWS account, with the AWS CLI configured using credentials that can
  deploy CloudFormation/CDK stacks — this project uses a named profile,
  `deep-cuts` (`aws configure --profile deep-cuts`), rather than relying on
  whatever the default profile happens to point to. That account/region also
  needs to be CDK-bootstrapped once before the sandbox will deploy:
  `npx cdk bootstrap aws://<account-id>/<region> --profile deep-cuts`.
- A Spotify app, created at the
  [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
  Add `http://127.0.0.1:3000/api/auth/callback/spotify` as a redirect URI
  for local dev (add your production URL there too once you've deployed).
  Spotify only allows `http://` for the loopback IP literal `127.0.0.1`, not
  the `localhost` hostname, so use `127.0.0.1` consistently — including in
  the browser URL bar when testing locally.

## Local development

```bash
cp .env.local.example .env.local
# fill in AUTH_SPOTIFY_ID / AUTH_SPOTIFY_SECRET from your Spotify app,
# generate AUTH_SECRET with: npx auth secret, and leave AUTH_URL as
# http://127.0.0.1:3000 (see .env.local.example for why it's needed —
# without it, sign-in fails at the Spotify callback with
# "invalid_grant: Invalid redirect URI")

npm install
npm run sandbox   # runs `ampx sandbox --profile deep-cuts` — provisions a
                   # personal, live copy of the backend (DynamoDB table +
                   # poll-spotify function) in your AWS account and writes
                   # amplify_outputs.json — leave this running while you
                   # develop; Ctrl-C tears it down
```

In a second terminal:

```bash
npm run dev
```

Then open [http://127.0.0.1:3000](http://127.0.0.1:3000) — not `localhost`,
since that won't match the redirect URI registered on the Spotify app.

Note: `npx ampx sandbox` deploys real (if tiny) AWS resources to your
account under a per-developer sandbox stack. It's part of the normal Gen 2
workflow, not accidental — just know it's happening.

### Listen-tracking secrets (poll-spotify)

The `poll-spotify` scheduled function (see Architecture above) refreshes
each connected user's Spotify access token on their behalf, using Spotify's
OAuth token endpoint directly — since Amplify functions don't inherit the
Next app's env vars, it needs its own copies of
`AUTH_SPOTIFY_ID`/`AUTH_SPOTIFY_SECRET` as sandbox secrets:

```bash
npm run sandbox:secrets   # reads AUTH_SPOTIFY_ID/AUTH_SPOTIFY_SECRET from
                           # .env.local and pushes them to `ampx sandbox
                           # secret set` for your sandbox
```

Run this once, any time after your first `npm run sandbox` deploy — sandbox
secrets are stored in AWS (SSM Parameter Store), scoped to your sandbox
*identity* (your OS username, by default), not to any one worktree or
`ampx sandbox` process. That means it doesn't need repeating per worktree or
per sandbox restart; only re-run it if you rotate your Spotify app's client
secret. Without it, `poll-spotify` will fail to refresh tokens and log an
error each time it runs, rather than recording any listens. The deployed
branch (Amplify Hosting) needs the same two variables configured separately
— see "Deploying" below.

## Deploying

1. Push this repo to GitHub (or another Amplify-supported git provider).
2. In the [Amplify console](https://console.aws.amazon.com/amplify/), create
   a new app from that repo. Amplify picks up `amplify.yml` automatically
   and deploys both the Next.js frontend and the `amplify/` backend
   (DynamoDB table, poll-spotify function) on every push to the connected
   branch.
3. In the Amplify console, set these environment variables:
   - `AUTH_SPOTIFY_ID`, `AUTH_SPOTIFY_SECRET`, `AUTH_SECRET` — same values as
     your `.env.local`
   - `AUTH_URL` — the app's deployed URL, e.g.
     `https://main.<app-id>.amplifyapp.com` (update this if you later attach
     a custom domain)

   Amplify Hosting only exposes these to the *build* step by default, not to
   the deployed Next.js server (route handlers, server actions,
   middleware) — `amplify.yml` explicitly writes them into `.env.production`
   during the build to bridge that gap. If you add more server-only env
   vars later, add them to that same `env | grep -e ...` line too.
4. Separately, set `AUTH_SPOTIFY_ID`/`AUTH_SPOTIFY_SECRET` as **Amplify
   backend secrets** (not the "Environment variables" from step 3 — a
   different mechanism, backing `secret()` in
   `amplify/functions/poll-spotify/resource.ts`, resolved from SSM at
   Lambda runtime). In the Amplify console, this is under the app's
   **Secrets** management page, scoped to the branch. There's no CLI
   equivalent for a Git-connected deploy (`ampx secret set` only exists
   under `ampx sandbox`) — `amplify.yml`'s `npx ampx pipeline-deploy` step
   already deploys the schedule (EventBridge → poll-spotify, every 15 min)
   automatically on every push, but without these secrets set, every
   invocation will fail to refresh any user's token and log an error
   per user rather than recording any listens.
5. Add the deployed domain's callback URL
   (`https://<your-domain>/api/auth/callback/spotify`) to your Spotify app's
   redirect URIs.

## Preview environments

Amplify Hosting can deploy every pull request as its own ephemeral,
full-stack environment — frontend *and* a fresh backend (DynamoDB table,
poll-spotify function) — and tear it down when the PR closes.

1. In the Amplify console: App settings → Previews → enable pull request
   previews (this installs/uses the Amplify GitHub App on this repo).
2. Recommended: App settings → Access control → restrict preview branches
   with HTTP basic auth, since preview URLs are otherwise reachable by
   anyone who has the link.
3. `AUTH_URL` no longer needs to be set by hand per preview — `amplify.yml`
   derives it from the branch's own `*.amplifyapp.com` domain
   (`AWS_BRANCH`/`AWS_APP_ID`, both set automatically by Amplify) whenever
   `AUTH_URL` isn't explicitly configured in the console. Keep setting it
   explicitly only for branches with a fixed non-default domain (e.g.
   production behind a custom domain).
4. Spotify OAuth itself won't work out of the box on a preview: Spotify
   requires each redirect URI to be registered exactly, no wildcards, and a
   preview's URL (`https://pr-<number>.<app-id>.amplifyapp.com`) is dynamic.
   To test the real sign-in flow on a given PR, add that one callback URL
   to your Spotify app's redirect URIs while you need it.
5. To view signed-in pages without doing that every time, set
   `ENABLE_PREVIEW_LOGIN=true` as an environment variable scoped to preview
   branches only (Amplify console → Environment variables → scope to "All
   pull-request previews") — **never** set it on the production branch.
   This adds a "Preview sign-in" button on the homepage that creates a fake
   session, so you can exercise the queue page (list, add, remove) against
   that preview's own backend. It carries no real Spotify access token, so
   Spotify-backed features (album search) stay non-functional under it —
   use the real Spotify sign-in (step 4) when you need those.

## Status

Built: Spotify OAuth sign-in, the DynamoDB data model, searching Spotify and
queuing albums (including browsing an artist's full discography), the queue
list (flat and grouped-by-artist views, with per-album listen-progress
indicators), the per-track played view on an album's track list, and the
poll-spotify handler itself (refresh-token persistence, matching
recently-played tracks against the queue, writing `ListenEvent`s).

Left to build: queuing an *artist* directly (the `Artist` model and
`/queue/artist/[artistId]` view exist, but nothing writes an `Artist` record
today — only individual albums get queued, including ones found via an
artist's discography page).

Listen tracking won't record anything in a given environment until its two
Spotify secrets are set — see "Listen-tracking secrets (poll-spotify)" above
for local sandboxes, and "Deploying" below for hosted branches.
