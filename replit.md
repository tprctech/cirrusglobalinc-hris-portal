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

- **Frontend**: React 19, TypeScript, Vite 7, @xyflow/react, lucide-react, html-to-image
- **Backend**: FastAPI, Pydantic, SQLAlchemy, psycopg2-binary, python-jose (JWT), uvicorn, mangum (Lambda adapter)
- **Database**: PostgreSQL (Replit-managed, via DATABASE_URL)
- **Infrastructure**: AWS CDK (optional)

## Key Files

- `apps/web/client/vite.config.ts` - Vite config (host: 0.0.0.0, port 5000, allowedHosts: true)
- `apps/api/app/main.py` - FastAPI entry point (creates DB tables on startup)
- `apps/api/app/api/v1/router.py` - API route registration
- `apps/api/app/core/middleware.py` - Audit logging middleware
- `apps/api/app/db/session.py` - SQLAlchemy engine/session factory
- `apps/api/app/db/models.py` - All SQLAlchemy ORM models (21 tables)
- `apps/api/app/db/init_db.py` - Table creation script
- `apps/api/app/api/v1/hr_center/` - HR Center CRUD route modules
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

### HR Center API (PostgreSQL-backed CRUD)

- `/api/v1/hr/employees/*` - Employee management (full employee profile with PH gov IDs)
- `/api/v1/hr/departments/*` - Department CRUD
- `/api/v1/hr/roles/*` - Role management (linked to competencies & departments)
- `/api/v1/hr/competencies/*` - Competencies with learning materials
- `/api/v1/hr/reviews/templates` - Review templates (sections + questions)
- `/api/v1/hr/reviews/question-sets` - Review question sets (sections + questions)
- `/api/v1/hr/surveys/templates` - Survey templates (sections + questions)
- `/api/v1/hr/surveys/question-sets` - Survey question sets (sections + questions)
- `/api/v1/hr/recognitions/badges` - Recognition badge management
- `/api/v1/hr/recognitions/rewards` - Reward catalog management
- `/api/v1/hr/recognitions/redeems` - Reward redeem tracking

## Database Tables (21 total)

employees, departments, roles, role_competencies, competencies, competency_learning_materials,
review_templates, review_template_sections, review_template_questions,
review_question_sets, review_question_set_sections, review_question_set_questions,
survey_templates, survey_template_sections, survey_template_questions,
survey_question_sets, survey_question_set_sections, survey_question_set_questions,
recognition_badges, rewards, reward_redeems

## Development Notes

- Frontend proxy is configured (`allowedHosts: true`) for Replit's preview iframe
- Backend uses localhost as host in dev; frontend uses 0.0.0.0
- PostgreSQL via Replit's DATABASE_URL; tables auto-created on FastAPI startup
- Training calendar default month hardcoded to April 2026
- Organization Chart export uses html-to-image; edge type is smoothstep
