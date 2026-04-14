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
- **Backend**: FastAPI, Pydantic, SQLAlchemy, psycopg2-binary, bcrypt, PyJWT, uvicorn, mangum (Lambda adapter), Pillow (image resizing), python-multipart (file uploads)
- **Database**: PostgreSQL (Replit-managed, via DATABASE_URL)
- **Infrastructure**: AWS CDK (optional)

## Authentication & Authorization

- **Login**: Email/password auth via JWT tokens stored in localStorage
- **Session duration**: 24 hours (configurable via `SESSION_DURATION_HOURS` env var)
- **JWT secret**: Configurable via `JWT_SECRET` env var (defaults to dev secret)
- **Portal roles**: Employee, Manager, HR, Admin (case-insensitive, normalized on save)
- **Role-based access**: HR Center only visible/accessible to HR and Admin roles
- **Auth context**: `useAuth()` hook provides `user`, `token`, `login()`, `logout()`, `hasRole()`
- **Profile data**: Header and profile page reflect logged-in employee's real DB data
- **User accounts table**: `user_accounts` (email, password_hash, employee_id FK, portal_role)
- **Default password**: `cirrus{year}` (e.g., `cirrus2026`)
- **Password reset (Admin/HR)**: `/auth/reset-password/{employee_id}` resets to default password
- **Change password (self-service)**: `/auth/change-password` lets any user change their own password via the profile dropdown
- **Future**: Microsoft SSO login will replace email/password

### Test Accounts (dev)
- `brent.david@cirrusrecruitment.com` / `cirrus2026` — Admin role (linked to John Brent David)
- `charlene.quirante@cirrusrecruitment.com` / `cirrus2026` — HR role (linked to Charlene Quirante)
- `bary.amalla@cirrusrecruitment.com` / `cirrus2026` — Employee role (linked to Bary Amalla)

## Key Files

- `apps/web/client/vite.config.ts` - Vite config (host: 0.0.0.0, port 5000, allowedHosts: true)
- `apps/web/client/src/app/AuthContext.tsx` - Auth context provider (JWT, role checks)
- `apps/web/client/src/api/auth.ts` - Auth API client (login, fetchMe, token storage)
- `apps/web/client/src/pages/LoginPage.tsx` - Login page component
- `apps/api/app/main.py` - FastAPI entry point (creates DB tables on startup)
- `apps/api/app/api/v1/router.py` - API route registration
- `apps/api/app/api/v1/auth.py` - Auth endpoints (login, register, me)
- `apps/api/app/core/middleware.py` - Audit logging middleware
- `apps/api/app/db/session.py` - SQLAlchemy engine/session factory
- `apps/api/app/db/models.py` - All SQLAlchemy ORM models (30 tables)
- `apps/api/app/db/init_db.py` - Table creation script
- `apps/api/app/api/v1/hr_center/` - HR Center CRUD route modules
- `apps/web/client/src/pages/admin-center/library/AdminDepartmentLibraryPage.tsx` - Department Library page (live API)
- `apps/web/client/src/pages/admin-center/library/AdminRoleLibraryPage.tsx` - Role Library page (live API)
- `apps/api/requirements.txt` - Python dependencies

## API Endpoints

- `GET /health` - Health check
- `GET /docs` - OpenAPI docs
- `POST /api/v1/auth/login` - Login (returns JWT token + user data)
- `GET /api/v1/auth/me` - Get current user from JWT (Authorization: Bearer header)
- `POST /api/v1/auth/register` - Register new user account
- `/api/v1/profile/*` - User profiles
- `/api/v1/reviews/*` - Performance reviews
- `/api/v1/kpis/*` - KPI tracking
- `/api/v1/surveys/*` - Surveys
- `/api/v1/feedback/*` - Feedback
- `/api/v1/recognitions/*` - Recognitions
- `/api/v1/rewards/*` - Rewards
- `/api/v1/admin/*` - Admin
- `/api/v1/onboarding/*` - Onboarding checklist (steps, document uploads)
- `/api/v1/notifications/*` - Notifications

### HR Center API (PostgreSQL-backed CRUD)

- `/api/v1/hr/employees/*` - Employee management (full profile with PH gov IDs, profile photo upload, employee search/lookup)
- `/api/v1/hr/departments/*` - Department CRUD (name, description, created_by, status Active/Not Active)
- `/api/v1/hr/roles/*` - Role management (linked to competencies & departments)
- `/api/v1/hr/competencies/*` - Competencies with learning materials
- `/api/v1/hr/reviews/templates` - Review templates (sections + questions)
- `/api/v1/hr/reviews/question-sets` - Review question sets (sections + questions)
- `/api/v1/hr/surveys/templates` - Survey templates (sections + questions)
- `/api/v1/hr/surveys/question-sets` - Survey question sets (sections + questions)
- `/api/v1/hr/recognitions/badges` - Recognition badge management
- `/api/v1/hr/recognitions/rewards` - Reward catalog management
- `/api/v1/hr/recognitions/redeems` - Reward redeem tracking
- `/api/v1/hr/employees/{id}/attachments` - Employee attachments (upload, list, download, delete)
- `/api/v1/hr/company-resources/*` - Company resources (file upload/download, category: Policies/Employee Handbook, is_active toggle)

### Review & Survey Response System

- **Review Cycles** (`review_cycles`): Assigns a review template to a reviewee; tracks status (Pending/In Progress/Completed)
- **Review Responses** (`review_responses`): One per respondent per cycle; status Draft or Submitted
- **Review Response Answers** (`review_response_answers`): Maps to template question via `question_id` + `section_id`; stores `answer_text`, `rating` (for stars), `selected_options` (newline-separated for multi-choice)
- **Survey Campaigns** (`survey_campaigns`): Creates a live survey from a template; tracks scope and status
- **Survey Responses** (`survey_responses`): One per respondent per campaign
- **Survey Response Answers** (`survey_response_answers`): Same answer schema as review answers
- **FormResponseModal**: Renders questions as answerable fields (textarea for Long Answer, radio for Single Choice, checkboxes for Multiple Choice, star picker for 5-Star Rating)
- **API flow**: Create cycle/campaign → GET detail (loads template sections/questions) → POST responses with answers array
- **Upsert pattern**: Saving a response for the same respondent replaces previous answers (draft overwrite)

## Database Tables (33 total)

user_accounts, employees, departments, roles, role_competencies, competencies, competency_learning_materials, employee_attachments, company_resources,
review_templates, review_template_sections, review_template_questions,
review_question_sets, review_question_set_sections, review_question_set_questions,
review_cycles, review_responses, review_response_answers,
survey_templates, survey_template_sections, survey_template_questions,
survey_question_sets, survey_question_set_sections, survey_question_set_questions,
survey_campaigns, survey_responses, survey_response_answers,
recognition_badges, rewards, reward_redeems,
onboarding_steps, onboarding_documents, onboarding_uploads

## Soft Delete

All main entity tables use **soft delete** — records are never physically removed from the database. Instead, an `is_deleted` boolean column (default `FALSE`) is set to `TRUE` when a record is "deleted."

Tables with `is_deleted`: `user_accounts`, `employees`, `departments`, `roles`, `competencies`, `recognition_badges`, `rewards`, `reward_redeems`, `review_templates`, `review_question_sets`, `survey_templates`, `survey_question_sets`, `employee_attachments`, `company_resources`, `onboarding_steps`, `onboarding_documents`, `onboarding_uploads`

Child tables (sections, questions, learning materials) do not have `is_deleted` — they remain in the DB when their parent is soft-deleted.

All list/get/update/delete endpoints filter by `is_deleted = FALSE`. Auth login and token checks also exclude soft-deleted users.

### Reporting (HR Center)

- **Review Reporting** (`/admin/reporting/reviews`): Lists all review cycles as clickable cards; drill-down view shows Google Forms-style response aggregation per question
- **Survey Reporting** (`/admin/reporting/surveys`): Lists all survey campaigns; same drill-down reporting view
- **Summary view**: Per-question aggregation — rating bars with average for Rating/5-Star Rating questions, percentage bars for Single Choice/Multiple Choice, scrollable text list for Long Answer
- **Individual view**: Paginated per-respondent view showing all answers
- **Sidebar**: "Reporting" accordion added to HR Center sidebar with Reviews and Surveys sub-links
- **Files**: `apps/web/client/src/pages/admin-center/reporting/AdminReportingReviewsPage.tsx`, `AdminReportingSurveysPage.tsx`, `AdminReporting.css`

### Onboarding Checklist

- **Employee Portal page** (`/onboarding`): Multi-step onboarding checklist with document upload tracking
- **Models**: `OnboardingStep` (title, description, sort_order) → `OnboardingDocument` (title, description, is_required) → `OnboardingUpload` (per-user file uploads)
- **API**: `GET /api/v1/onboarding/steps` (list steps with user's upload progress), `POST /api/v1/onboarding/documents/{id}/upload`, `DELETE /api/v1/onboarding/uploads/{id}`, `GET /api/v1/onboarding/uploads/{id}/download`
- **File storage**: `apps/api/uploads/onboarding/` directory; max 10MB; allowed: PDF, JPG, PNG, WEBP, DOC, DOCX
- **Security**: All endpoints require JWT auth; download endpoint enforces user ownership (no IDOR)
- **Step 1 (seeded)**: "Signing of Forms and Contract" — 8 required documents (Contract, Declaration of Consent, JD, Contract without salary, NBI Clearance, Data Privacy Consent, Passport-size Photos, CV/Resume)
- **Files**: `apps/api/app/api/v1/onboarding.py`, `apps/web/client/src/pages/employee-portal/OnboardingPage.tsx`

## Development Notes

- Frontend proxy is configured (`allowedHosts: true`) for Replit's preview iframe; Vite proxies `/api` → `localhost:8000`
- Backend uses localhost as host in dev; frontend uses 0.0.0.0
- PostgreSQL via Replit's DATABASE_URL; tables auto-created on FastAPI startup
- Training calendar default month hardcoded to April 2026
- Organization Chart export uses backend PDF generation via fpdf2
- Company Resources: files stored in `apps/api/uploads/`; DB tracks metadata (title, category, file_name, file_path, file_size, is_active, uploaded_by); Home page fetches active resources from API
- AdminUser type uses `teamflectRole` internally but displays as "Portal Role" (values: Employee, Manager, HR, Admin)
- Date fields displayed as mm/dd/yyyy; stored as ISO yyyy-mm-dd; converted in employees.ts
- Profile photos stored as base64 data URIs in DB; resized to max 400x400 JPEG on upload
- Supervisor field: searchable dropdown via `/api/v1/hr/employees/search/lookup`
- Reviewers field: multi-select with tag chips, same search endpoint
- `xlsx` npm package used for Excel template download + bulk upload parsing
- Bulk upload checks for duplicate employees by employee_id, email, or full name before creating
