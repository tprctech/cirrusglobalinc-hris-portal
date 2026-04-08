import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.models import EmployeeAttachment
from app.db.session import get_db

router = APIRouter()

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))),
    "uploads",
    "attachments",
)
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 25 * 1024 * 1024


@router.get("/{employee_id}/attachments")
def list_attachments(employee_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(EmployeeAttachment)
        .filter(
            EmployeeAttachment.employee_id == employee_id,
            EmployeeAttachment.is_deleted == False,
        )
        .order_by(EmployeeAttachment.created_at.desc())
        .all()
    )
    return [_to_dict(r) for r in rows]


@router.post("/{employee_id}/attachments")
async def upload_attachment(
    employee_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "File size exceeds 25MB limit")

    ext = os.path.splitext(file.filename or "")[1].lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(content)

    attachment = EmployeeAttachment(
        employee_id=employee_id,
        file_name=file.filename or unique_name,
        file_path=unique_name,
        file_size=len(content),
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return _to_dict(attachment)


@router.delete("/{employee_id}/attachments/{attachment_id}")
def delete_attachment(employee_id: int, attachment_id: int, db: Session = Depends(get_db)):
    r = db.query(EmployeeAttachment).filter(
        EmployeeAttachment.id == attachment_id,
        EmployeeAttachment.employee_id == employee_id,
        EmployeeAttachment.is_deleted == False,
    ).first()
    if not r:
        raise HTTPException(404, "Attachment not found")
    r.is_deleted = True
    r.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Attachment deleted"}


@router.get("/{employee_id}/attachments/{attachment_id}/download")
def download_attachment(employee_id: int, attachment_id: int, db: Session = Depends(get_db)):
    r = db.query(EmployeeAttachment).filter(
        EmployeeAttachment.id == attachment_id,
        EmployeeAttachment.employee_id == employee_id,
        EmployeeAttachment.is_deleted == False,
    ).first()
    if not r:
        raise HTTPException(404, "Attachment not found")
    file_path = os.path.join(UPLOAD_DIR, r.file_path)
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found on server")
    return FileResponse(file_path, filename=r.file_name)


def _to_dict(r: EmployeeAttachment) -> dict:
    return {
        "id": r.id,
        "employee_id": r.employee_id,
        "file_name": r.file_name,
        "file_size": r.file_size,
        "is_deleted": r.is_deleted,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }
