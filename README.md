# Cirrus Performance Hub

Monorepo for Teamflect replacement:
- `apps/web`: React SPA (Vite + React + TypeScript)
- `apps/api`: FastAPI service (Lambda-ready via Mangum)
- `packages/contracts`: OpenAPI contracts
- `packages/ui`: shared UI tokens/components
- `infra/cdk`: AWS infrastructure as code (CDK)

## Prerequisites
- Node.js 20+
- npm 10+
- Python 3.12+
- pip
- (Optional) AWS CLI + CDK CLI for infrastructure deployment

## Project Structure
- `apps/web` frontend application
- `apps/api` backend API
- `infra/cdk` AWS stack definitions

## 1. Install Dependencies
Run from repository root:

```powershell
npm install
```

Install backend dependencies:

```powershell
cd apps/api
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -r requirements-dev.txt
cd ../..
```

## 2. Run Frontend Locally
From repository root:

```powershell
npm run dev:web
```

Default URL: `http://localhost:5173`

## 3. Run Backend Locally
From repository root:

```powershell
cd apps/api
. .venv/Scripts/Activate.ps1
uvicorn app.main:app --reload --port 8000
```

API URLs:
- Health: `http://localhost:8000/health`
- OpenAPI docs: `http://localhost:8000/docs`
- Versioned routes base: `http://localhost:8000/api/v1`

## 4. Run Frontend + Backend Together
Use two terminals:

Terminal 1 (frontend):
```powershell
npm run dev:web
```

Terminal 2 (backend):
```powershell
cd apps/api
. .venv/Scripts/Activate.ps1
uvicorn app.main:app --reload --port 8000
```

## 5. Quality Checks
Frontend:

```powershell
npm run lint:web
npm run typecheck:web
npm run build:web
```

Backend:

```powershell
cd apps/api
. .venv/Scripts/Activate.ps1
ruff check .
pytest -q
```

## 6. Infrastructure (Optional)
From root:

```powershell
cd infra/cdk
npm install
npm run build
npm run synth
```

To deploy (requires AWS credentials configured):

```powershell
npm run deploy
```

## Common Issues
- PowerShell execution policy blocks venv activation:
  - Run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
- `uvicorn` not found:
  - Ensure venv is activated and `pip install -r requirements-dev.txt` completed.
- Port conflicts:
  - Change frontend/backend ports (`vite --port`, `uvicorn --port`).

## Principles
- Contract-first APIs
- RBAC and proxy-safe access controls
- Auditability and observability by default
- Cost-efficient AWS serverless deployment
