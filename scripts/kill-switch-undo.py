#!/usr/bin/env python3
"""Reverses everything the budget kill switch (see README.md) does when it
fires: removes Lambda concurrency limits, re-enables the poll-spotify
schedules, drops the S3 bucket deny policies, disassociates the WAF block-all
ACL from AppSync, and detaches the IAM deny policy from the deploy role.

Defaults to the `deep-cuts-breakglass` profile, not `deep-cuts`, on purpose:
the kill switch's IAM deny action attaches to `OrganizationAccountAccessRole`
(what `deep-cuts` assumes), so if this script used that profile it would be
locked out by the exact thing it's meant to undo. `deep-cuts-breakglass` is a
separate IAM user carrying only the narrow permissions this script needs, so
it keeps working whether or not the deny has fired.

Requires: pip3 install boto3 (one-time), and the `deep-cuts-breakglass` AWS
CLI profile (see README.md's "Cost controls" section for how it's set up).

Usage:
    python3 scripts/kill-switch-undo.py                     # dry run, shows what it would do
    python3 scripts/kill-switch-undo.py --apply              # actually undoes it
    python3 scripts/kill-switch-undo.py --profile deep-cuts  # override the profile, e.g. for testing
"""
import argparse
import json
import sys

import boto3

REGION = "us-east-1"
TARGET_ROLE_NAME = "OrganizationAccountAccessRole"
DENY_POLICY_NAME = "DeepCutsBudgetCapDeny"
WEB_ACL_NAME = "BudgetCapBlockAll"
DEFAULT_PROFILE = "deep-cuts-breakglass"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="actually make the changes (default is dry run)")
    parser.add_argument("--profile", default=DEFAULT_PROFILE, help=f"AWS CLI profile to use (default: {DEFAULT_PROFILE})")
    args = parser.parse_args()
    apply = args.apply

    session = boto3.Session(profile_name=args.profile, region_name=REGION)
    account_id = session.client("sts").get_caller_identity()["Account"]

    print(f"{'APPLYING' if apply else 'DRY RUN (pass --apply to make changes)'} against account {account_id}\n")

    # 1. Lambda concurrency
    lam = session.client("lambda")
    for page in lam.get_paginator("list_functions").paginate():
        for fn in page["Functions"]:
            name = fn["FunctionName"]
            has_limit = "ReservedConcurrentExecutions" in fn
            if has_limit:
                print(f"[lambda] {name}: has a reserved concurrency limit -> {'removing' if apply else 'would remove'}")
                if apply:
                    lam.delete_function_concurrency(FunctionName=name)
            else:
                print(f"[lambda] {name}: no limit set, nothing to do")

    # 2. EventBridge schedules
    sched = session.client("scheduler")
    for page in sched.get_paginator("list_schedules").paginate():
        for s in page["Schedules"]:
            full = sched.get_schedule(Name=s["Name"], GroupName=s.get("GroupName", "default"))
            if full["State"] == "DISABLED":
                print(f"[schedule] {s['Name']}: disabled -> {'enabling' if apply else 'would enable'}")
                if apply:
                    sched.update_schedule(
                        Name=full["Name"],
                        GroupName=full["GroupName"],
                        ScheduleExpression=full["ScheduleExpression"],
                        FlexibleTimeWindow=full["FlexibleTimeWindow"],
                        Target=full["Target"],
                        State="ENABLED",
                    )
            else:
                print(f"[schedule] {s['Name']}: already enabled, nothing to do")

    # 3. S3 bucket policies
    s3 = session.client("s3")
    for b in s3.list_buckets()["Buckets"]:
        name = b["Name"]
        try:
            policy = json.loads(s3.get_bucket_policy(Bucket=name)["Policy"])
        except s3.exceptions.from_code("NoSuchBucketPolicy"):
            print(f"[s3] {name}: no bucket policy, nothing to do")
            continue
        sids = [st.get("Sid") for st in policy.get("Statement", [])]
        if "BudgetCapDenyDataPlane" in sids:
            print(f"[s3] {name}: has the kill-switch deny policy -> {'removing' if apply else 'would remove'}")
            if apply:
                s3.delete_bucket_policy(Bucket=name)
        else:
            print(f"[s3] {name}: has a bucket policy, but not the kill-switch one — leaving it alone")

    # 4. AppSync / WAF
    appsync = session.client("appsync")
    wafv2 = session.client("wafv2")
    web_acls = wafv2.list_web_acls(Scope="REGIONAL").get("WebACLs", [])
    match = next((w for w in web_acls if w["Name"] == WEB_ACL_NAME), None)
    if match:
        for api in appsync.list_graphql_apis().get("graphqlApis", []):
            try:
                assoc = wafv2.get_web_acl_for_resource(ResourceArn=api["arn"]).get("WebACL")
            except wafv2.exceptions.WAFNonexistentItemException:
                assoc = None
            if assoc and assoc["Name"] == WEB_ACL_NAME:
                print(f"[appsync] {api['name']} ({api['apiId']}): blocked by {WEB_ACL_NAME} -> {'unblocking' if apply else 'would unblock'}")
                if apply:
                    wafv2.disassociate_web_acl(ResourceArn=api["arn"])
            else:
                print(f"[appsync] {api['name']} ({api['apiId']}): not blocked, nothing to do")
    else:
        print(f"[appsync] {WEB_ACL_NAME} doesn't exist yet, nothing to do")

    # 5. IAM deny policy on the deploy role
    iam = session.client("iam")
    deny_policy_arn = f"arn:aws:iam::{account_id}:policy/{DENY_POLICY_NAME}"
    attached = iam.list_attached_role_policies(RoleName=TARGET_ROLE_NAME)["AttachedPolicies"]
    if any(p["PolicyArn"] == deny_policy_arn for p in attached):
        print(f"[iam] {TARGET_ROLE_NAME}: kill-switch deny policy is attached -> {'detaching' if apply else 'would detach'}")
        if apply:
            iam.detach_role_policy(RoleName=TARGET_ROLE_NAME, PolicyArn=deny_policy_arn)
    else:
        print(f"[iam] {TARGET_ROLE_NAME}: deny policy not attached, nothing to do")

    print("\nDone." if apply else "\nDry run complete — re-run with --apply to make these changes.")


if __name__ == "__main__":
    sys.exit(main())
