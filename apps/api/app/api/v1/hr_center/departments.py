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


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None


class DepartmentOut(BaseModel):
    id: int
    name: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.get("/", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).order_by(Department.name).all()


@router.get("/{department_id}", response_model=DepartmentOut)
def get_department(department_id: int, db: Session = Depends(get_db)):
    row = db.query(Department).filter(Department.id == department_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Department not found")
    return row


@router.post("/", response_model=DepartmentOut, status_code=201)
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db)):
    row = Department(name=payload.name)
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Department with this name already exists")
    db.refresh(row)
    return row


@router.put("/{department_id}", response_model=DepartmentOut)
def update_department(department_id: int, payload: DepartmentUpdate, db: Session = Depends(get_db)):
    row = db.query(Department).filter(Department.id == department_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Department not found")
    if payload.name is not None:
        row.name = payload.name
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{department_id}", status_code=204)
def delete_department(department_id: int, db: Session = Depends(get_db)):
    row = db.query(Department).filter(Department.id == department_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(row)
    db.commit()
