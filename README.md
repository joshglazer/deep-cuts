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

- An AWS account, with the AWS CLI configured (`aws configure`) using
  credentials that can deploy CloudFormation/CDK stacks.
- A Spotify app, created at the
  [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
  Add `http://localhost:3000/api/auth/callback/spotify` as a redirect URI
  for local dev (add your production URL there too once you've deployed).

## Local development

```bash
cp .env.local.example .env.local
# fill in AUTH_SPOTIFY_ID / AUTH_SPOTIFY_SECRET from your Spotify app,
# and generate AUTH_SECRET with: npx auth secret

npm install
npx ampx sandbox   # provisions a personal, live copy of the backend (DynamoDB
                    # table + poll-spotify function) in your AWS account and
                    # writes amplify_outputs.json — leave this running while
                    # you develop; Ctrl-C tears it down
```

In a second terminal:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

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
3. In the Amplify console, set the `AUTH_SPOTIFY_ID`, `AUTH_SPOTIFY_SECRET`,
   and `AUTH_SECRET` environment variables (same values as your
   `.env.local`).
4. Add the deployed domain's callback URL
   (`https://<your-domain>/api/auth/callback/spotify`) to your Spotify app's
   redirect URIs.

## What's scaffolded vs. what's left

Scaffolded: project structure, Spotify OAuth sign-in, the DynamoDB data
model, and the shape of the polling job (including its IAM wiring).

Left to build: the actual queue UI (search Spotify, add to queue), the
poll-spotify handler's logic (refresh tokens, call
`/me/player/recently-played`, match against the queue, write
`ListenEvent`s), and persisting refresh tokens somewhere the scheduled
function can read them (it runs with no user session).
