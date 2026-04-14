import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.db.models import (
    OnboardingDocument,
    OnboardingStep,
    OnboardingUpload,
    UserAccount,
    Employee,
)
from app.db.session import get_db

router = APIRouter()

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "uploads",
    "onboarding",
)
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024


def _get_current_user_id(request: Request) -> int:
    import jwt
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(
            token,
            os.environ.get("JWT_SECRET", "cirrus-dev-secret-change-in-prod"),
            algorithms=["HS256"],
        )
        return int(payload.get("sub", 0))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


class UploadOut(BaseModel):
    id: int
    document_id: int
    file_name: str
    file_size: int
    created_at: str | None


class DocumentOut(BaseModel):
    id: int
    title: str
    description: str
    sort_order: int
    is_required: bool
    upload: UploadOut | None


class StepOut(BaseModel):
    id: int
    title: str
    description: str
    sort_order: int
    documents: list[DocumentOut]
    total_documents: int
    completed_documents: int


@router.get("/steps")
def list_steps(request: Request, db: Session = Depends(get_db)) -> list[StepOut]:
    user_id = _get_current_user_id(request)

    steps = (
        db.query(OnboardingStep)
        .filter(OnboardingStep.is_deleted == False, OnboardingStep.is_active == True)
        .options(joinedload(OnboardingStep.documents).joinedload(OnboardingDocument.uploads))
        .order_by(OnboardingStep.sort_order)
        .all()
    )

    result = []
    for step in steps:
        active_docs = [d for d in step.documents if not d.is_deleted]
        active_docs.sort(key=lambda d: d.sort_order)

        doc_list = []
        completed = 0
        for doc in active_docs:
            user_uploads = [
                u for u in doc.uploads if u.user_id == user_id and not u.is_deleted
            ]
            latest = None
            if user_uploads:
                latest_upload = max(user_uploads, key=lambda u: u.created_at or datetime.min)
                latest = UploadOut(
                    id=latest_upload.id,
                    document_id=doc.id,
                    file_name=latest_upload.file_name,
                    file_size=latest_upload.file_size,
                    created_at=latest_upload.created_at.isoformat() if latest_upload.created_at else None,
                )
                completed += 1

            doc_list.append(DocumentOut(
                id=doc.id,
                title=doc.title,
                description=doc.description or "",
                sort_order=doc.sort_order,
                is_required=doc.is_required,
                upload=latest,
            ))

        result.append(StepOut(
            id=step.id,
            title=step.title,
            description=step.description or "",
            sort_order=step.sort_order,
            documents=doc_list,
            total_documents=len(active_docs),
            completed_documents=completed,
        ))
    return result


@router.post("/documents/{document_id}/upload")
async def upload_document(
    document_id: int,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    user_id = _get_current_user_id(request)

    doc = db.query(OnboardingDocument).filter(
        OnboardingDocument.id == document_id,
        OnboardingDocument.is_deleted == False,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document requirement not found")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    allowed_ext = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {', '.join(allowed_ext)}")

    existing = db.query(OnboardingUpload).filter(
        OnboardingUpload.document_id == document_id,
        OnboardingUpload.user_id == user_id,
        OnboardingUpload.is_deleted == False,
    ).all()
    for old in existing:
        old.is_deleted = True

    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(content)

    upload = OnboardingUpload(
        document_id=document_id,
        user_id=user_id,
        file_name=file.filename or unique_name,
        file_path=unique_name,
        file_size=len(content),
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    return {
        "id": upload.id,
        "document_id": upload.document_id,
        "file_name": upload.file_name,
        "file_size": upload.file_size,
        "created_at": upload.created_at.isoformat() if upload.created_at else None,
    }


@router.delete("/uploads/{upload_id}")
def delete_upload(upload_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = _get_current_user_id(request)

    upload = db.query(OnboardingUpload).filter(
        OnboardingUpload.id == upload_id,
        OnboardingUpload.user_id == user_id,
        OnboardingUpload.is_deleted == False,
    ).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    upload.is_deleted = True
    db.commit()
    return {"ok": True}


@router.get("/uploads/{upload_id}/download")
def download_upload(upload_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = _get_current_user_id(request)

    upload = db.query(OnboardingUpload).filter(
        OnboardingUpload.id == upload_id,
        OnboardingUpload.user_id == user_id,
        OnboardingUpload.is_deleted == False,
    ).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    file_path = os.path.join(UPLOAD_DIR, upload.file_path)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    ext = os.path.splitext(upload.file_name)[1].lower()
    media_map = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    media_type = media_map.get(ext, "application/octet-stream")

    return FileResponse(
        path=file_path,
        filename=upload.file_name,
        media_type=media_type,
    )
