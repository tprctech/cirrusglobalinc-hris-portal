from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import Department
from app.db.session import get_db

router = APIRouter()


class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    created_by: Optional[str] = ""
    status: Optional[str] = "Active"


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    created_by: Optional[str] = None
    status: Optional[str] = None


class DepartmentOut(BaseModel):
    id: int
    name: str
    description: str
    created_by: str
    status: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


def _to_out(row: Department) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "description": row.description or "",
        "created_by": row.created_by or "",
        "status": row.status or "Active",
        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }


@router.get("/", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    rows = db.query(Department).order_by(Department.name).all()
    return [_to_out(r) for r in rows]


@router.get("/{department_id}", response_model=DepartmentOut)
def get_department(department_id: int, db: Session = Depends(get_db)):
    row = db.query(Department).filter(Department.id == department_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Department not found")
    return _to_out(row)


@router.post("/", response_model=DepartmentOut, status_code=201)
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db)):
    VALID_STATUSES = {"active": "Active", "not active": "Inactive", "inactive": "Inactive"}
    status = VALID_STATUSES.get((payload.status or "Active").strip().lower(), "Active")

    row = Department(
        name=payload.name.strip(),
        description=payload.description or "",
        created_by=payload.created_by or "",
        status=status,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Department with this name already exists")
    db.refresh(row)
    return _to_out(row)


@router.put("/{department_id}", response_model=DepartmentOut)
def update_department(department_id: int, payload: DepartmentUpdate, db: Session = Depends(get_db)):
    row = db.query(Department).filter(Department.id == department_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Department not found")

    if payload.name is not None:
        row.name = payload.name.strip()
    if payload.description is not None:
        row.description = payload.description
    if payload.created_by is not None:
        row.created_by = payload.created_by
    if payload.status is not None:
        VALID_STATUSES = {"active": "Active", "not active": "Inactive", "inactive": "Inactive"}
        row.status = VALID_STATUSES.get(payload.status.strip().lower(), "Active")

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Department with this name already exists")
    db.refresh(row)
    return _to_out(row)


@router.delete("/{department_id}", status_code=204)
def delete_department(department_id: int, db: Session = Depends(get_db)):
    row = db.query(Department).filter(Department.id == department_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(row)
    db.commit()
