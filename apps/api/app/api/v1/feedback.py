from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.auth import decode_token
from app.db.models import Feedback, UserAccount, Employee
from app.db.session import get_db

router = APIRouter()


def _get_current_user_id(authorization: str = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    return int(payload["sub"])


class FeedbackCreate(BaseModel):
    to_user_id: int
    title: str
    description: str


def _user_display_name(user: UserAccount) -> str:
    if user.employee:
        e = user.employee
        parts = [e.first_name or "", e.last_name or ""]
        name = " ".join(p for p in parts if p).strip()
        return name if name else (e.display_name or user.email)
    return user.email


def _serialize_feedback(fb: Feedback, perspective: str) -> dict:
    other_user = fb.to_user if perspective == "given" else fb.from_user
    other_email = other_user.email if other_user else ""
    other_name = _user_display_name(other_user) if other_user else ""

    result = {
        "id": fb.id,
        "title": fb.title,
        "description": fb.description,
        "date": fb.created_at.strftime("%m/%d/%Y") if fb.created_at else "",
    }
    if perspective == "given":
        result["to"] = other_name
        result["toEmail"] = other_email
    else:
        result["from"] = other_name
        result["fromEmail"] = other_email
    return result


@router.post("/employee")
def create_employee_feedback(
    body: FeedbackCreate,
    db: Session = Depends(get_db),
    authorization: str = Header(None),
):
    current_user_id = _get_current_user_id(authorization)

    to_user = db.query(UserAccount).filter(
        UserAccount.id == body.to_user_id,
        UserAccount.is_deleted == False,
        UserAccount.is_active == True,
    ).first()
    if not to_user:
        raise HTTPException(status_code=404, detail="Recipient user not found")

    if to_user.id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot send feedback to yourself")

    fb = Feedback(
        from_user_id=current_user_id,
        to_user_id=body.to_user_id,
        title=body.title.strip(),
        description=body.description,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)

    return _serialize_feedback(fb, "given")


@router.get("/received")
def list_received_feedback(
    db: Session = Depends(get_db),
    authorization: str = Header(None),
):
    current_user_id = _get_current_user_id(authorization)

    items = (
        db.query(Feedback)
        .filter(Feedback.to_user_id == current_user_id, Feedback.is_deleted == False)
        .order_by(Feedback.created_at.desc())
        .all()
    )
    return {"items": [_serialize_feedback(fb, "received") for fb in items]}


@router.get("/given")
def list_given_feedback(
    db: Session = Depends(get_db),
    authorization: str = Header(None),
):
    current_user_id = _get_current_user_id(authorization)

    items = (
        db.query(Feedback)
        .filter(Feedback.from_user_id == current_user_id, Feedback.is_deleted == False)
        .order_by(Feedback.created_at.desc())
        .all()
    )
    return {"items": [_serialize_feedback(fb, "given") for fb in items]}


@router.get("/users")
def list_feedback_users(
    q: str = "",
    db: Session = Depends(get_db),
    authorization: str = Header(None),
):
    _get_current_user_id(authorization)

    query = (
        db.query(UserAccount)
        .outerjoin(Employee, UserAccount.employee_id == Employee.id)
        .filter(UserAccount.is_deleted == False, UserAccount.is_active == True)
    )

    if q.strip():
        like = f"%{q.strip()}%"
        query = query.filter(
            (Employee.first_name.ilike(like))
            | (Employee.last_name.ilike(like))
            | (Employee.display_name.ilike(like))
            | (UserAccount.email.ilike(like))
        )

    users = query.order_by(Employee.first_name, Employee.last_name).limit(30).all()

    results = []
    for u in users:
        name = _user_display_name(u)
        results.append({"id": u.id, "name": name, "email": u.email})

    return {"items": results}
