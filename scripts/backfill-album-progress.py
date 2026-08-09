#!/usr/bin/env python3
"""Backfills `playedTrackIds`/`lastPlayedAt` on every existing Album row from
its ListenEvent history, ahead of/after deploying the amplify/data/resource.ts
schema change that adds those fields.

Progress display (list/artist pages) switched from querying ListenEvent live
on every page load to reading these denormalized fields straight off Album
— without this backfill, every album a user already made progress on would
read as 0 played until a *new* play happens to touch it again (poll-spotify
only updates playedTrackIds for albums it sees in a user's last ~50
recently-played items, so an album nobody's actively replaying would stay
stuck at 0 indefinitely).

Safe to run before or after the schema deploy — DynamoDB items don't need a
schema to hold arbitrary attributes, so this can backfill the raw table
directly either way. Table names aren't hardcoded (see
migrate-queued-at-to-added-at.py for why); discovered the same way, via each
table's `amplify:branch-name`/`amplify:deployment-type` tag.

Requires: pip3 install boto3 (one-time), and the `deep-cuts` AWS CLI profile.

Usage:
    python3 scripts/backfill-album-progress.py                        # dry run against production
    python3 scripts/backfill-album-progress.py --apply                # actually backfill production
    python3 scripts/backfill-album-progress.py --env sandbox --apply  # backfill your local sandbox
    python3 scripts/backfill-album-progress.py --profile deep-cuts    # override the profile
"""
import argparse
import sys
from collections import defaultdict

import boto3

REGION = "us-east-1"
APP_ID = "d213vwy4ydt1"
DEFAULT_PROFILE = "deep-cuts"


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


def scan_all(table):
    items = []
    scan_kwargs = {}
    while True:
        page = table.scan(**scan_kwargs)
        items.extend(page["Items"])
        if "LastEvaluatedKey" not in page:
            break
        scan_kwargs["ExclusiveStartKey"] = page["LastEvaluatedKey"]
    return items


def compute_progress_by_album(listen_events):
    """(spotifyUserId, spotifyAlbumId) -> (played track ids, most recent playedAt), skipping excludedAt rows."""
    played_track_ids = defaultdict(set)
    last_played_at = {}
    for event in listen_events:
        if event.get("excludedAt"):
            continue
        album_id = event.get("spotifyAlbumId")
        track_id = event.get("spotifyTrackId")
        if not album_id or not track_id:
            continue
        key = (event["spotifyUserId"], album_id)
        played_track_ids[key].add(track_id)
        played_at = event.get("playedAt")
        if played_at and (key not in last_played_at or played_at > last_played_at[key]):
            last_played_at[key] = played_at
    return played_track_ids, last_played_at


def backfill_albums(table, albums, played_track_ids, last_played_at, apply):
    scanned = 0
    already = 0
    no_plays = 0
    backfilled = 0

    for album in albums:
        scanned += 1
        if "playedTrackIds" in album:
            already += 1
            continue

        key = (album["spotifyUserId"], album["spotifyAlbumId"])
        track_ids = played_track_ids.get(key)
        if not track_ids:
            no_plays += 1
            continue

        backfilled += 1
        ids = sorted(track_ids)
        played_at = last_played_at[key]
        verb = "backfilling" if apply else "would backfill"
        print(
            f"[{table.name}] {album['id']} ({album.get('name')!r}): "
            f"{verb} {len(ids)} played tracks, lastPlayedAt={played_at}"
        )
        if apply:
            table.update_item(
                Key={"id": album["id"]},
                UpdateExpression="SET playedTrackIds = :ids, lastPlayedAt = :lp",
                ExpressionAttributeValues={":ids": ids, ":lp": played_at},
                ConditionExpression="attribute_not_exists(playedTrackIds)",
            )

    print(
        f"[{table.name}] scanned {scanned}, already had playedTrackIds: {already}, "
        f"no plays to backfill: {no_plays}, backfilled: {backfilled}\n"
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="actually write the backfilled fields (default is dry run)")
    parser.add_argument("--env", choices=["production", "sandbox"], default="production", help="which deployment to target (default: production)")
    parser.add_argument("--profile", default=DEFAULT_PROFILE, help=f"AWS CLI profile to use (default: {DEFAULT_PROFILE})")
    args = parser.parse_args()

    session = boto3.Session(profile_name=args.profile, region_name=REGION)
    account_id = session.client("sts").get_caller_identity()["Account"]
    print(f"{'APPLYING' if args.apply else 'DRY RUN (pass --apply to make changes)'} against account {account_id}, env={args.env}\n")

    tagging = session.client("resourcegroupstaggingapi")
    dynamodb = session.resource("dynamodb", region_name=REGION)

    album_table = dynamodb.Table(find_table_name(tagging, "Album", args.env))
    listen_event_table = dynamodb.Table(find_table_name(tagging, "ListenEvent", args.env))

    print(f"Scanning {listen_event_table.name}...")
    listen_events = scan_all(listen_event_table)
    played_track_ids, last_played_at = compute_progress_by_album(listen_events)

    print(f"Scanning {album_table.name}...")
    albums = scan_all(album_table)

    backfill_albums(album_table, albums, played_track_ids, last_played_at, args.apply)

    print("Done." if args.apply else "Dry run complete — re-run with --apply to write these changes.")


if __name__ == "__main__":
    sys.exit(main())
