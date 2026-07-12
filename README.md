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
  Lambda (every 15 min) that will poll each connected user's Spotify
  "recently played" endpoint and record matches against their queue as
  `ListenEvent`s. Spotify has no push/webhook API for this, so polling is
  the only option. Currently a stub — see the TODO in its `handler.ts`.

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
4. Add the deployed domain's callback URL
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

## What's scaffolded vs. what's left

Scaffolded: project structure, Spotify OAuth sign-in, the DynamoDB data
model, and the shape of the polling job (including its IAM wiring).

Left to build: the actual queue UI (search Spotify, add to queue), the
poll-spotify handler's logic (refresh tokens, call
`/me/player/recently-played`, match against the queue, write
`ListenEvent`s), and persisting refresh tokens somewhere the scheduled
function can read them (it runs with no user session).
