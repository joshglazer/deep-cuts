#!/usr/bin/env bash
set -euo pipefail

# Sets the two Amplify sandbox secrets the poll-spotify Lambda needs to
# refresh users' Spotify access tokens on their behalf (Amplify functions
# don't inherit the Next app's env vars). See README.md for when to run
# this — one-time per sandbox identity, not per worktree.

if [ ! -f .env.local ]; then
  echo "error: .env.local not found — copy .env.local.example and fill it in first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env.local
set +a

for var in AUTH_SPOTIFY_ID AUTH_SPOTIFY_SECRET; do
  value="${!var:-}"
  if [ -z "$value" ]; then
    echo "error: $var is empty in .env.local — fill it in before running this script." >&2
    exit 1
  fi
  printf '%s' "$value" | npx ampx sandbox secret set "$var" --profile deep-cuts
done
