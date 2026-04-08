import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.models import CompanyResource
from app.db.session import get_db

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 10 * 1024 * 1024


@router.get("/")
def list_resources(category: str | None = None, db: Session = Depends(get_db)):
    q = db.query(CompanyResource).filter(CompanyResource.is_deleted == False)
    if category:
        q = q.filter(CompanyResource.category == category)
    q = q.order_by(CompanyResource.created_at.desc())
    rows = q.all()
    return [_to_dict(r) for r in rows]


@router.get("/{resource_id}")
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    r = db.query(CompanyResource).filter(
        CompanyResource.id == resource_id,
        CompanyResource.is_deleted == False,
    ).first()
    if not r:
        raise HTTPException(404, "Resource not found")
    return _to_dict(r)


@router.post("/")
async def create_resource(
    title: str = Form(...),
    category: str = Form(...),
    uploaded_by: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if category not in ("Policies", "Employee Handbook"):
        raise HTTPException(400, "Category must be 'Policies' or 'Employee Handbook'")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type '{ext}' not allowed")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "File size exceeds 25MB limit")

    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(dest_path, "wb") as f:
        f.write(content)

    resource = CompanyResource(
        title=title,
        category=category,
        file_name=file.filename or unique_name,
        file_path=unique_name,
        file_size=len(content),
        is_active=True,
        uploaded_by=uploaded_by.lower().strip(),
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return _to_dict(resource)


@router.put("/{resource_id}")
async def update_resource(
    resource_id: int,
    title: str = Form(None),
    category: str = Form(None),
    is_active: str = Form(None),
    uploaded_by: str = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    r = db.query(CompanyResource).filter(
        CompanyResource.id == resource_id,
        CompanyResource.is_deleted == False,
    ).first()
    if not r:
        raise HTTPException(404, "Resource not found")

    if title is not None:
        r.title = title
    if category is not None:
        if category not in ("Policies", "Employee Handbook"):
            raise HTTPException(400, "Category must be 'Policies' or 'Employee Handbook'")
        r.category = category
    if is_active is not None:
        r.is_active = is_active.lower() in ("true", "1", "yes")
    if uploaded_by is not None:
        r.uploaded_by = uploaded_by.lower().strip()

    if file is not None:
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(400, f"File type '{ext}' not allowed")

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(400, "File size exceeds 25MB limit")

        old_path = os.path.join(UPLOAD_DIR, r.file_path)
        if os.path.exists(old_path):
            os.remove(old_path)

        unique_name = f"{uuid.uuid4().hex}{ext}"
        new_path = os.path.join(UPLOAD_DIR, unique_name)
        with open(new_path, "wb") as f:
            f.write(content)

        r.file_name = file.filename or unique_name
        r.file_path = unique_name
        r.file_size = len(content)

    r.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(r)
    return _to_dict(r)


@router.delete("/{resource_id}")
def delete_resource(resource_id: int, db: Session = Depends(get_db)):
    r = db.query(CompanyResource).filter(
        CompanyResource.id == resource_id,
        CompanyResource.is_deleted == False,
    ).first()
    if not r:
        raise HTTPException(404, "Resource not found")
    r.is_deleted = True
    r.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Resource deleted"}


@router.get("/{resource_id}/download")
def download_resource(resource_id: int, db: Session = Depends(get_db)):
    r = db.query(CompanyResource).filter(
        CompanyResource.id == resource_id,
        CompanyResource.is_deleted == False,
    ).first()
    if not r:
        raise HTTPException(404, "Resource not found")
    file_path = os.path.join(UPLOAD_DIR, r.file_path)
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found on server")
    return FileResponse(file_path, filename=r.file_name)


def _to_dict(r: CompanyResource) -> dict:
    return {
        "id": r.id,
        "title": r.title,
        "category": r.category,
        "file_name": r.file_name,
        "file_size": r.file_size,
        "is_active": r.is_active,
        "uploaded_by": r.uploaded_by,
        "is_deleted": r.is_deleted,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }
