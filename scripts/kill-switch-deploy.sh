#!/usr/bin/env bash
set -euo pipefail

# Redeploys scripts/kill-switch-lambda/index.py to the live
# deep-cuts-budget-kill-switch Lambda and syncs permissions.json to its
# execution role (DeepCutsKillSwitchExecRole). AWS doesn't read from this
# repo — edits to either file are inert until this runs. Run it after
# extending the kill switch to cover a new AWS service (see CLAUDE.md and
# README.md's "Cost controls" section for when/why).

cd "$(dirname "$0")/kill-switch-lambda"

zip -q -r /tmp/kill-switch-function.zip index.py
aws lambda update-function-code \
  --profile deep-cuts \
  --function-name deep-cuts-budget-kill-switch \
  --zip-file fileb:///tmp/kill-switch-function.zip \
  > /dev/null
rm /tmp/kill-switch-function.zip

aws iam put-role-policy \
  --profile deep-cuts \
  --role-name DeepCutsKillSwitchExecRole \
  --policy-name KillSwitchPermissions \
  --policy-document file://permissions.json

echo "Deployed index.py and synced permissions.json to DeepCutsKillSwitchExecRole"
