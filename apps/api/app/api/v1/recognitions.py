from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import RecognitionBadge, RecognitionGiven, Employee
from app.db.session import get_db

router = APIRouter()


def _get_current_email(request: Request) -> str:
    import jwt, os
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return ""
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, os.environ.get("JWT_SECRET", "changeme"), algorithms=["HS256"])
        user_id = int(payload.get("sub", 0))
    except Exception:
        return ""
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        emp = db.query(Employee).filter(Employee.user_id == user_id).first()
        return emp.email if emp else ""
    finally:
        db.close()


class BadgeOut(BaseModel):
    id: int
    image: str
    title: str
    description: str
    is_official: bool
    point: int

    class Config:
        from_attributes = True


class GiveRecognitionIn(BaseModel):
    to_email: str
    badge_id: int
    message: Optional[str] = ""


class RecognitionOut(BaseModel):
    id: int
    from_email: str
    to_email: str
    badge_title: str
    badge_image: str
    message: str
    points: int
    created_at: Optional[datetime]
    from_name: Optional[str] = ""
    to_name: Optional[str] = ""


class PointsOut(BaseModel):
    total: int


@router.get("/badges")
def list_badges(include_official: bool = True, db: Session = Depends(get_db)) -> list[BadgeOut]:
    q = db.query(RecognitionBadge).filter(
        RecognitionBadge.is_deleted == False,
        RecognitionBadge.is_active == True,
    )
    if not include_official:
        q = q.filter(RecognitionBadge.is_official == False)
    return [BadgeOut.model_validate(b) for b in q.order_by(RecognitionBadge.id).all()]


@router.post("/give")
def give_recognition(payload: GiveRecognitionIn, request: Request, db: Session = Depends(get_db)) -> RecognitionOut:
    from_email = _get_current_email(request)
    if not from_email:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if payload.to_email.strip().lower() == from_email.strip().lower():
        raise HTTPException(status_code=400, detail="You cannot give a recognition to yourself")

    badge = db.query(RecognitionBadge).filter(
        RecognitionBadge.id == payload.badge_id,
        RecognitionBadge.is_deleted == False,
        RecognitionBadge.is_active == True,
    ).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")

    rec = RecognitionGiven(
        from_email=from_email,
        to_email=payload.to_email,
        badge_id=badge.id,
        message=payload.message or "",
        points=badge.point,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    from_emp = db.query(Employee).filter(Employee.email == from_email).first()
    to_emp = db.query(Employee).filter(Employee.email == payload.to_email).first()

    return RecognitionOut(
        id=rec.id,
        from_email=rec.from_email,
        to_email=rec.to_email,
        badge_title=badge.title,
        badge_image=badge.image or "",
        message=rec.message,
        points=rec.points,
        created_at=rec.created_at,
        from_name=f"{from_emp.first_name} {from_emp.last_name}" if from_emp else "",
        to_name=f"{to_emp.first_name} {to_emp.last_name}" if to_emp else "",
    )


def _build_recognition_out(rec: RecognitionGiven, db: Session) -> RecognitionOut:
    badge = rec.badge
    from_emp = db.query(Employee).filter(Employee.email == rec.from_email).first()
    to_emp = db.query(Employee).filter(Employee.email == rec.to_email).first()
    return RecognitionOut(
        id=rec.id,
        from_email=rec.from_email,
        to_email=rec.to_email,
        badge_title=badge.title if badge else "",
        badge_image=badge.image if badge else "",
        message=rec.message or "",
        points=rec.points,
        created_at=rec.created_at,
        from_name=f"{from_emp.first_name} {from_emp.last_name}" if from_emp else rec.from_email,
        to_name=f"{to_emp.first_name} {to_emp.last_name}" if to_emp else rec.to_email,
    )


@router.get("/received")
def list_received(request: Request, db: Session = Depends(get_db)) -> list[RecognitionOut]:
    email = _get_current_email(request)
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated")
    recs = (
        db.query(RecognitionGiven)
        .filter(RecognitionGiven.to_email == email, RecognitionGiven.is_deleted == False)
        .order_by(RecognitionGiven.created_at.desc())
        .all()
    )
    return [_build_recognition_out(r, db) for r in recs]


@router.get("/given")
def list_given(request: Request, db: Session = Depends(get_db)) -> list[RecognitionOut]:
    email = _get_current_email(request)
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated")
    recs = (
        db.query(RecognitionGiven)
        .filter(RecognitionGiven.from_email == email, RecognitionGiven.is_deleted == False)
        .order_by(RecognitionGiven.created_at.desc())
        .all()
    )
    return [_build_recognition_out(r, db) for r in recs]


@router.get("/points")
def get_points(request: Request, db: Session = Depends(get_db)) -> PointsOut:
    email = _get_current_email(request)
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated")
    received = (
        db.query(RecognitionGiven)
        .filter(RecognitionGiven.to_email == email, RecognitionGiven.is_deleted == False)
        .all()
    )
    total = sum(r.points for r in received)
    return PointsOut(total=total)
