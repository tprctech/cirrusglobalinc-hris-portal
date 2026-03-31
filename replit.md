# Cirrus Performance Hub

A monorepo for the Cirrus Performance Hub (CPH), a Teamflect replacement built with React + FastAPI.

## Project Structure

- `apps/web/client` - React SPA (Vite + React + TypeScript), runs on port 5000
- `apps/api` - FastAPI backend service (Python 3.12), runs on port 8000
- `packages/contracts` - OpenAPI contracts
- `packages/ui` - Shared UI tokens/components
- `infra/cdk` - AWS CDK infrastructure

## Running the App

Two workflows are configured:
- **Start application**: Frontend (Vite dev server on port 5000)
- **Backend API**: FastAPI server (uvicorn on port 8000)

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7, @xyflow/react, lucide-react
- **Backend**: FastAPI, Pydantic, python-jose (JWT), boto3 (AWS), uvicorn, mangum (Lambda adapter)
- **Infrastructure**: AWS CDK (optional)

## Key Files

- `apps/web/client/vite.config.ts` - Vite config (host: 0.0.0.0, port 5000, allowedHosts: true)
- `apps/api/app/main.py` - FastAPI entry point
- `apps/api/app/api/v1/router.py` - API route registration
- `apps/api/app/core/middleware.py` - Audit logging middleware
- `apps/api/requirements.txt` - Python dependencies

## API Endpoints

- `GET /health` - Health check
- `GET /docs` - OpenAPI docs
- `/api/v1/auth/*` - Authentication
- `/api/v1/profile/*` - User profiles
- `/api/v1/reviews/*` - Performance reviews
- `/api/v1/kpis/*` - KPI tracking
- `/api/v1/surveys/*` - Surveys
- `/api/v1/feedback/*` - Feedback
- `/api/v1/recognitions/*` - Recognitions
- `/api/v1/rewards/*` - Rewards
- `/api/v1/admin/*` - Admin
- `/api/v1/notifications/*` - Notifications

## Development Notes

- Frontend proxy is configured (`allowedHosts: true`) for Replit's preview iframe
- Backend uses localhost as host in dev; frontend uses 0.0.0.0
- No database configured yet (likely AWS DynamoDB in production via boto3)
