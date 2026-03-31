from fastapi import APIRouter
from pydantic import BaseModel

from app.core.security import Role, require_roles

router = APIRouter()


class AutosavePayload(BaseModel):
    draft: dict


@router.post("/review-cycles")
def create_review_cycle() -> dict:
    return {"status": "created"}


@router.post("/reviews/{review_id}/autosave")
def autosave_review(review_id: str, payload: AutosavePayload) -> dict:
    return {"review_id": review_id, "saved": True, "size": len(payload.draft)}


@router.post("/reviews/{review_id}/submit")
def submit_review(review_id: str) -> dict:
    return {"review_id": review_id, "submitted": True}


@router.get("/reviews/{review_id}/export")
def export_review(review_id: str) -> dict:
    return {"review_id": review_id, "export_url": "s3://cph-exports/demo.pdf"}
