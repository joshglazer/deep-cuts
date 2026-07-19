# Deep Cuts

Add artists and albums to your list to listen to on Spotify, then track
whether you actually got around to them.

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
  matches against their list as `ListenEvent`s. Spotify has no push/webhook
  API for this, so polling is the only option. The list pages read those
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
   session, so you can exercise the list page (list, add, remove) against
   that preview's own backend. It carries no real Spotify access token, so
   Spotify-backed features (album search) stay non-functional under it —
   use the real Spotify sign-in (step 4) when you need those.

## Cost controls: the $50 budget kill switch

Account `194089666599` has an AWS Budget (`deep-cuts-monthly-cap`) capped at
$50/month, with an automated kill switch attached — not just a spend alert.
This exists because of a July 2026 incident where an AWS-side Cost Explorer
bug briefly displayed a multi-million dollar S3 charge (confirmed by AWS as
a display-only "Inaccurate Estimated Billing Data" bug — no real usage or
charges were involved); this account's real spend normally runs a few cents
a month, so $50 is a wide margin that should only ever trip on genuine
runaway usage.

**Alerts**: email to the account owner at 80% ($40) and 100% ($50) of actual
monthly spend. Console: Billing and Cost Management → Budgeting and
Planning → Budgets (see "Switching into this account" below).

**At 100% ($50), two things fire automatically and in parallel:**

1. A full-deny IAM policy (`DeepCutsBudgetCapDeny`) attaches to
   `OrganizationAccountAccessRole` — blocks further deploys or CLI/console
   changes made through that role.
2. The budget notification publishes to an SNS topic
   (`deep-cuts-budget-kill-switch`), which triggers a Lambda function of the
   same name. That function:
   - Sets every Lambda function's reserved concurrency to `0` (nothing can
     execute, including `poll-spotify`)
   - Disables both `poll-spotify` EventBridge schedules (sandbox + main)
   - Attaches a deny policy to every S3 bucket (blocks Get/Put/Delete/List)
   - Creates/reuses a WAFv2 Web ACL (`BudgetCapBlockAll`, default action
     `Block`) and associates it with both AppSync APIs

That WAF association is the piece that actually takes the live site down
for real visitors, not just deploys — this is a genuine full stop by
design, since the account owner decided a real spend spike is worth an
outage to contain.

### What's covered automatically, and what isn't

The kill switch Lambda (`scripts/kill-switch-lambda/index.py`, deployed as
`deep-cuts-budget-kill-switch`) discovers what to act on live, at fire time
— it calls `list_functions`/`list_schedules`/`list_buckets`/
`list_graphql_apis` fresh each run rather than working off a fixed list,
and its IAM permissions (`scripts/kill-switch-lambda/permissions.json`,
attached to `DeepCutsKillSwitchExecRole`) are scoped to `Resource: "*"`
rather than specific ARNs. So:

- **New resources of the same four types — automatically covered.** A new
  Lambda function, a new S3 bucket, a new schedule, a second AppSync API —
  all included the next time the switch fires, no code or permission
  changes needed.
- **A new AWS service category — not covered until someone updates it.**
  The kill switch only has logic for Lambda, EventBridge Scheduler, S3, and
  AppSync. If this project ever adds something outside those four (RDS,
  EC2, CloudFront, SQS, Cognito, Bedrock, anything) it will keep running
  (and keep costing money) right through a firing, until `index.py` gets a
  new step for it and `permissions.json` gets the IAM actions that step
  needs.
- **Everything is scoped to `us-east-1`.** A resource deployed to a
  different region wouldn't be discovered by any of the `list_*` calls
  above.

After editing `index.py` and/or `permissions.json`, run
`scripts/kill-switch-deploy.sh` — AWS doesn't read from this repo, so
edits are inert until that runs. It redeploys the Lambda code and
re-syncs the IAM permissions in one step. Sanity-check with a dry run
before trusting it:

```bash
aws lambda invoke --profile deep-cuts \
  --function-name deep-cuts-budget-kill-switch \
  --payload '{"dry_run": true}' --cli-binary-format raw-in-base64-out \
  /tmp/out.json && cat /tmp/out.json
```

### Undoing it

Nothing above deletes code or data — it's all reversible.

```bash
pip3 install boto3   # one-time, if not already installed
python3 scripts/kill-switch-undo.py            # dry run — shows what it would undo
python3 scripts/kill-switch-undo.py --apply    # actually undoes it
```

The script checks each of the five things above independently and only
touches what's actually still in the "fired" state, so it's safe to re-run.

**Why this doesn't lock itself out.** The obvious trap: the IAM deny action
attaches to `OrganizationAccountAccessRole` — the same role the `deep-cuts`
CLI profile assumes — so a recovery script that also used `deep-cuts` would
be blocked by the exact thing it's trying to undo. (Switching role into
`OrganizationAccountAccessRole` from the root account doesn't help either —
the deny is attached to that role itself, so any session assuming it
inherits the block, regardless of how you got there.) To avoid this,
`kill-switch-undo.py` defaults to a separate profile,
**`deep-cuts-breakglass`**, backed by a dedicated IAM user
(`DeepCutsBreakGlassRecovery`) that's never a target of the deny policy and
carries only the narrow permissions needed to undo the five things above —
nothing else. It keeps working whether or not the deny has fired.

That profile's access key lives in `~/.aws/credentials` on this machine
only. **Back it up in a password manager** — if this machine is what's
unavailable, that's the only other copy. To rotate it: `aws iam
create-access-key --profile deep-cuts --user-name
DeepCutsBreakGlassRecovery`, update `~/.aws/credentials`, then `aws iam
delete-access-key --profile deep-cuts --user-name
DeepCutsBreakGlassRecovery --access-key-id <old-id>`.

**Turning the kill switch off entirely** (not just undoing one firing):
delete the budget action via `aws budgets delete-budget-action
--account-id 194089666599 --budget-name deep-cuts-monthly-cap --action-id
<id>` (get `<id>` from `describe-budget-actions-for-budget`) and unsubscribe
or delete the SNS topic. The $50 budget and its email alerts can be left in
place on their own without the automated actions, if you'd rather just be
notified than have it self-enforce.

## Status

Built: Spotify OAuth sign-in, the DynamoDB data model, searching Spotify and
adding albums to the list (including browsing an artist's full discography),
the list itself (flat and grouped-by-artist views, with per-album
listen-progress indicators), the per-track played view on an album's track
list, and the poll-spotify handler itself (refresh-token persistence,
matching recently-played tracks against the list, writing `ListenEvent`s).

Left to build: adding an *artist* directly (the `Artist` model and
`/list/artist/[artistId]` view exist, but nothing writes an `Artist` record
today — only individual albums get added to the list, including ones found
via an artist's discography page).

Listen tracking won't record anything in a given environment until its two
Spotify secrets are set — see "Listen-tracking secrets (poll-spotify)" above
for local sandboxes, and "Deploying" below for hosted branches.
