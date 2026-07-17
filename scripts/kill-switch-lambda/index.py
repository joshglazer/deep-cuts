import json
import boto3

def handler(event, context):
    dry_run = False
    if isinstance(event, dict):
        dry_run = bool(event.get('dry_run', False))
        for rec in (event.get('Records') or []):
            try:
                msg = json.loads(rec['Sns']['Message'])
                if isinstance(msg, dict) and msg.get('dry_run'):
                    dry_run = True
            except Exception:
                pass

    results = {'dry_run': dry_run, 'lambda': [], 'schedules': [], 'buckets': [], 'appsync': []}
    session = boto3.Session()
    this_fn = context.function_name if context else None

    lam = session.client('lambda')
    for page in lam.get_paginator('list_functions').paginate():
        for fn in page['Functions']:
            name = fn['FunctionName']
            if name == this_fn:
                continue
            try:
                if not dry_run:
                    lam.put_function_concurrency(FunctionName=name, ReservedConcurrentExecutions=0)
                results['lambda'].append({'function': name, 'status': 'would_zero' if dry_run else 'zeroed'})
            except Exception as e:
                results['lambda'].append({'function': name, 'error': str(e)})

    sched = session.client('scheduler')
    for page in sched.get_paginator('list_schedules').paginate():
        for s in page['Schedules']:
            try:
                full = sched.get_schedule(Name=s['Name'], GroupName=s.get('GroupName', 'default'))
                if not dry_run:
                    sched.update_schedule(
                        Name=full['Name'], GroupName=full['GroupName'],
                        ScheduleExpression=full['ScheduleExpression'],
                        FlexibleTimeWindow=full['FlexibleTimeWindow'],
                        Target=full['Target'], State='DISABLED'
                    )
                results['schedules'].append({'schedule': s['Name'], 'status': 'would_disable' if dry_run else 'disabled'})
            except Exception as e:
                results['schedules'].append({'schedule': s['Name'], 'error': str(e)})

    s3 = session.client('s3')
    for b in s3.list_buckets()['Buckets']:
        name = b['Name']
        policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Sid": "BudgetCapDenyDataPlane",
                "Effect": "Deny",
                "Principal": "*",
                "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
                "Resource": [f"arn:aws:s3:::{name}", f"arn:aws:s3:::{name}/*"]
            }]
        }
        try:
            if not dry_run:
                s3.put_bucket_policy(Bucket=name, Policy=json.dumps(policy))
            results['buckets'].append({'bucket': name, 'status': 'would_lock' if dry_run else 'locked'})
        except Exception as e:
            results['buckets'].append({'bucket': name, 'error': str(e)})

    try:
        appsync = session.client('appsync')
        wafv2 = session.client('wafv2')
        apis = appsync.list_graphql_apis().get('graphqlApis', [])
        if apis:
            existing = wafv2.list_web_acls(Scope='REGIONAL').get('WebACLs', [])
            match = next((w for w in existing if w['Name'] == 'BudgetCapBlockAll'), None)
            web_acl_arn = match['ARN'] if match else None
            if not web_acl_arn and not dry_run:
                resp = wafv2.create_web_acl(
                    Name='BudgetCapBlockAll',
                    Scope='REGIONAL',
                    DefaultAction={'Block': {}},
                    VisibilityConfig={'SampledRequestsEnabled': True, 'CloudWatchMetricsEnabled': True, 'MetricName': 'BudgetCapBlockAll'},
                    Rules=[]
                )
                web_acl_arn = resp['Summary']['ARN']
            for api in apis:
                try:
                    if web_acl_arn and not dry_run:
                        wafv2.associate_web_acl(WebACLArn=web_acl_arn, ResourceArn=api['arn'])
                    results['appsync'].append({'api': api['name'], 'apiId': api['apiId'], 'status': 'would_block' if dry_run else 'blocked'})
                except Exception as e:
                    results['appsync'].append({'api': api['name'], 'error': str(e)})
    except Exception as e:
        results['appsync_error'] = str(e)

    print(json.dumps(results))
    return results
