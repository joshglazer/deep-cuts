#!/usr/bin/env python3
"""Backfills the `addedAt` field (renamed from `queuedAt`) on every existing
Artist/Album row, ahead of deploying the amplify/data/resource.ts schema
change that makes `addedAt` required. Run this — and confirm it reports 0
items still missing `addedAt` — before merging/deploying that schema change,
otherwise GraphQL will return a non-null-violation for every row that hasn't
been backfilled yet (breaking the list page until it catches up).

`queuedAt` is left in place on each item afterward — it becomes an inert
extra attribute once the schema/app code stop referencing it, and removing
it isn't necessary for correctness.

Table names aren't hardcoded (they include a random per-deployment suffix,
e.g. `Album-<id>-NONE`) — this discovers the right table for --env via its
`amplify:branch-name`/`amplify:deployment-type` tag, same idea as reading
account-wide state by tag/name in kill-switch-undo.py.

Requires: pip3 install boto3 (one-time), and the `deep-cuts` AWS CLI profile.

Usage:
    python3 scripts/migrate-queued-at-to-added-at.py                        # dry run against production
    python3 scripts/migrate-queued-at-to-added-at.py --apply                # actually backfill production
    python3 scripts/migrate-queued-at-to-added-at.py --env sandbox --apply  # backfill your local sandbox
    python3 scripts/migrate-queued-at-to-added-at.py --profile deep-cuts    # override the profile
"""
import argparse
import sys

import boto3

REGION = "us-east-1"
APP_ID = "d213vwy4ydt1"
DEFAULT_PROFILE = "deep-cuts"
MODELS = ["Artist", "Album"]
OLD_FIELD = "queuedAt"
NEW_FIELD = "addedAt"


def find_table_name(tagging_client, model, env):
    tag_filters = [{"Key": "amplify:friendly-name", "Values": ["amplifyData"]}]
    if env == "production":
        tag_filters += [
            {"Key": "amplify:app-id", "Values": [APP_ID]},
            {"Key": "amplify:branch-name", "Values": ["main"]},
        ]
    else:
        tag_filters += [{"Key": "amplify:deployment-type", "Values": ["sandbox"]}]

    resources = tagging_client.get_resources(
        ResourceTypeFilters=["dynamodb:table"],
        TagFilters=tag_filters,
    )["ResourceTagMappingList"]

    matches = [
        r["ResourceARN"].rsplit("/", 1)[1]
        for r in resources
        if r["ResourceARN"].rsplit("/", 1)[1].startswith(f"{model}-")
    ]
    if len(matches) != 1:
        raise SystemExit(
            f"Expected exactly one {env} table for {model}, found {len(matches)}: {matches}"
        )
    return matches[0]


def migrate_table(dynamodb, table_name, apply):
    table = dynamodb.Table(table_name)
    scanned = 0
    already = 0
    backfilled = 0

    scan_kwargs = {}
    while True:
        page = table.scan(**scan_kwargs)
        for item in page["Items"]:
            scanned += 1
            if NEW_FIELD in item:
                already += 1
                continue
            if OLD_FIELD not in item:
                continue
            backfilled += 1
            verb = "backfilling" if apply else "would backfill"
            print(f"[{table_name}] {item['id']}: {OLD_FIELD}={item[OLD_FIELD]!r} -> {verb} {NEW_FIELD}")
            if apply:
                table.update_item(
                    Key={"id": item["id"]},
                    UpdateExpression="SET #new = :val",
                    ExpressionAttributeNames={"#new": NEW_FIELD},
                    ExpressionAttributeValues={":val": item[OLD_FIELD]},
                    ConditionExpression="attribute_not_exists(#new)",
                )
        if "LastEvaluatedKey" not in page:
            break
        scan_kwargs["ExclusiveStartKey"] = page["LastEvaluatedKey"]

    print(f"[{table_name}] scanned {scanned}, already had {NEW_FIELD}: {already}, backfilled: {backfilled}\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="actually write the backfilled field (default is dry run)")
    parser.add_argument("--env", choices=["production", "sandbox"], default="production", help="which deployment to target (default: production)")
    parser.add_argument("--profile", default=DEFAULT_PROFILE, help=f"AWS CLI profile to use (default: {DEFAULT_PROFILE})")
    args = parser.parse_args()

    session = boto3.Session(profile_name=args.profile, region_name=REGION)
    account_id = session.client("sts").get_caller_identity()["Account"]
    print(f"{'APPLYING' if args.apply else 'DRY RUN (pass --apply to make changes)'} against account {account_id}, env={args.env}\n")

    tagging = session.client("resourcegroupstaggingapi")
    dynamodb = session.resource("dynamodb", region_name=REGION)

    for model in MODELS:
        table_name = find_table_name(tagging, model, args.env)
        migrate_table(dynamodb, table_name, args.apply)

    print("Done." if args.apply else "Dry run complete — re-run with --apply to write these changes.")


if __name__ == "__main__":
    sys.exit(main())
