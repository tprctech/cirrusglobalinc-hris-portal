from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import Competency, Role
from app.db.session import get_db

router = APIRouter()


class RoleCreate(BaseModel):
    role_job_title: str
    role_description: Optional[str] = ""
    users_in_role: Optional[int] = 0
    department_id: Optional[int] = None
    created_by: Optional[str] = ""
    competency_ids: Optional[list[int]] = []


class RoleUpdate(BaseModel):
    role_job_title: Optional[str] = None
    role_description: Optional[str] = None
    users_in_role: Optional[int] = None
    department_id: Optional[int] = None
    created_by: Optional[str] = None
    competency_ids: Optional[list[int]] = None


class RoleOut(BaseModel):
    id: int
    role_job_title: str
    role_description: str
    users_in_role: int
    department_id: Optional[int]
    department_name: Optional[str] = None
    required_competencies: Optional[str] = None
    created_by: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


def _to_out(row: Role) -> dict:
    dept_name = row.department_rel.name if row.department_rel else ""
    comp_names = ", ".join(c.competency_name for c in row.competencies) if row.competencies else ""
    return {
        "id": row.id,
        "role_job_title": row.role_job_title,
        "role_description": row.role_description or "",
        "users_in_role": row.users_in_role or 0,
        "department_id": row.department_id,
        "department_name": dept_name,
        "required_competencies": comp_names,
        "created_by": row.created_by or "",
        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }


@router.get("/", response_model=list[RoleOut])
def list_roles(db: Session = Depends(get_db)):
    rows = db.query(Role).all()
    return [_to_out(r) for r in rows]


@router.get("/{role_id}", response_model=RoleOut)
def get_role(role_id: int, db: Session = Depends(get_db)):
    row = db.query(Role).filter(Role.id == role_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Role not found")
    return _to_out(row)


@router.post("/", response_model=RoleOut, status_code=201)
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"competency_ids"})
    row = Role(**data)
    if payload.competency_ids:
        comps = db.query(Competency).filter(Competency.id.in_(payload.competency_ids)).all()
        row.competencies = comps
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.put("/{role_id}", response_model=RoleOut)
def update_role(role_id: int, payload: RoleUpdate, db: Session = Depends(get_db)):
    row = db.query(Role).filter(Role.id == role_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Role not found")
    updates = payload.model_dump(exclude_unset=True, exclude={"competency_ids"})
    for k, v in updates.items():
        setattr(row, k, v)
    if payload.competency_ids is not None:
        comps = db.query(Competency).filter(Competency.id.in_(payload.competency_ids)).all()
        row.competencies = comps
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.delete("/{role_id}", status_code=204)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    row = db.query(Role).filter(Role.id == role_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Role not found")
    db.delete(row)
    db.commit()
