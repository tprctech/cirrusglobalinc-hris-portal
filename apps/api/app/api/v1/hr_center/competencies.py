from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from sqlalchemy import func
from app.db.models import Competency, CompetencyLearningMaterial, role_competencies
from app.db.session import get_db

router = APIRouter()


class LearningMaterialIn(BaseModel):
    material_type: Optional[str] = "Link"
    url: Optional[str] = ""
    name: Optional[str] = ""
    description: Optional[str] = ""
    category: Optional[str] = ""
    duration: Optional[str] = ""


class LearningMaterialOut(BaseModel):
    id: int
    material_type: str
    url: str
    name: str
    description: str
    category: str
    duration: str

    class Config:
        from_attributes = True


class CompetencyCreate(BaseModel):
    competency_code: str
    competency_name: str
    competency_description: Optional[str] = ""
    expectations: Optional[str] = ""
    competency_level: Optional[str] = ""
    competency_experts: Optional[str] = ""
    created_by: Optional[str] = ""
    status: Optional[str] = "Active"
    learning_materials: Optional[list[LearningMaterialIn]] = []


class CompetencyUpdate(BaseModel):
    competency_code: Optional[str] = None
    competency_name: Optional[str] = None
    competency_description: Optional[str] = None
    expectations: Optional[str] = None
    competency_level: Optional[str] = None
    competency_experts: Optional[str] = None
    created_by: Optional[str] = None
    status: Optional[str] = None
    learning_materials: Optional[list[LearningMaterialIn]] = None


class CompetencyOut(BaseModel):
    id: int
    competency_code: str
    competency_name: str
    competency_description: str
    expectations: str
    competency_level: str
    competency_experts: str
    created_by: str
    status: str
    learning_materials: list[LearningMaterialOut]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


VALID_STATUSES = {"active": "Active", "inactive": "Inactive"}


@router.get("/", response_model=list[CompetencyOut])
def list_competencies(db: Session = Depends(get_db)):
    return db.query(Competency).order_by(Competency.competency_code).all()


@router.get("/{competency_id}", response_model=CompetencyOut)
def get_competency(competency_id: int, db: Session = Depends(get_db)):
    row = db.query(Competency).filter(Competency.id == competency_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Competency not found")
    return row


@router.post("/", response_model=CompetencyOut, status_code=201)
def create_competency(payload: CompetencyCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"learning_materials"})
    data["status"] = VALID_STATUSES.get((data.get("status") or "Active").strip().lower(), "Active")
    row = Competency(**data)
    for mat in (payload.learning_materials or []):
        row.learning_materials.append(CompetencyLearningMaterial(**mat.model_dump()))
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Competency with this code already exists")
    db.refresh(row)
    return row


@router.put("/{competency_id}", response_model=CompetencyOut)
def update_competency(competency_id: int, payload: CompetencyUpdate, db: Session = Depends(get_db)):
    row = db.query(Competency).filter(Competency.id == competency_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Competency not found")
    updates = payload.model_dump(exclude_unset=True, exclude={"learning_materials"})
    if "status" in updates:
        if updates["status"] is None:
            del updates["status"]
        else:
            updates["status"] = VALID_STATUSES.get(updates["status"].strip().lower(), "Active")
    for k, v in updates.items():
        setattr(row, k, v)
    if payload.learning_materials is not None:
        row.learning_materials.clear()
        for mat in payload.learning_materials:
            row.learning_materials.append(CompetencyLearningMaterial(**mat.model_dump()))
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{competency_id}", status_code=204)
def delete_competency(competency_id: int, db: Session = Depends(get_db)):
    row = db.query(Competency).filter(Competency.id == competency_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Competency not found")
    role_count = db.scalar(
        role_competencies.select().where(role_competencies.c.competency_id == competency_id).with_only_columns(func.count())
    )
    if role_count and role_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete this competency because it is currently assigned to {role_count} role(s).",
        )
    db.delete(row)
    db.commit()
