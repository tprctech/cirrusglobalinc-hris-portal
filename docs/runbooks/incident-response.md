# Incident Response Runbook

## Triage
1. Check CloudWatch alarms.
2. Identify failing endpoint and request ids.
3. Verify Cognito auth and API Gateway health.

## Mitigation
1. Roll back latest deployment if regression suspected.
2. Drain or redrive DLQ for transient async failures.
3. Communicate impact window and ETA.

## Recovery
1. Validate health endpoint and smoke tests.
2. Confirm error rate and p95 latency return to baseline.
