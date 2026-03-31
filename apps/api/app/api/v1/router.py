from fastapi import APIRouter

from app.api.v1 import admin, auth, feedback, kpis, notifications, profile, recognitions, reviews, rewards, surveys

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
