from fastapi import APIRouter

from app.api.v1 import admin, auth, feedback, kpis, notifications, profile, recognitions, reviews, rewards, surveys
from app.api.v1.hr_center import (
    competencies as hr_competencies,
    departments as hr_departments,
    employees as hr_employees,
    recognition_config as hr_recognition,
    review_config as hr_reviews,
    roles as hr_roles,
    survey_config as hr_surveys,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(profile.router, tags=["profile"])
api_router.include_router(reviews.router, tags=["reviews"])
api_router.include_router(kpis.router, tags=["kpis"])
api_router.include_router(surveys.router, tags=["surveys"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(recognitions.router, prefix="/recognitions", tags=["recognitions"])
api_router.include_router(rewards.router, prefix="/rewards", tags=["rewards"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

api_router.include_router(hr_employees.router, prefix="/hr/employees", tags=["hr-employees"])
api_router.include_router(hr_departments.router, prefix="/hr/departments", tags=["hr-departments"])
api_router.include_router(hr_roles.router, prefix="/hr/roles", tags=["hr-roles"])
api_router.include_router(hr_competencies.router, prefix="/hr/competencies", tags=["hr-competencies"])
api_router.include_router(hr_reviews.router, prefix="/hr/reviews", tags=["hr-reviews-config"])
api_router.include_router(hr_surveys.router, prefix="/hr/surveys", tags=["hr-surveys-config"])
api_router.include_router(hr_recognition.router, prefix="/hr/recognitions", tags=["hr-recognitions-config"])
