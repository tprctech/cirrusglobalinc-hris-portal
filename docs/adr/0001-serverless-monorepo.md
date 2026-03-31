# ADR 0001: Serverless monorepo architecture

## Status
Accepted

## Decision
Use React SPA + FastAPI Lambda with AWS CDK-managed infrastructure.

## Rationale
- Lower operational overhead for small teams
- Scale-to-zero backend at low traffic
- Cost-efficient for startup load profile

## Consequences
- Cold starts must be monitored
- DynamoDB access patterns must be designed intentionally
