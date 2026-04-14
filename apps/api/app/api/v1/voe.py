import os

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.auth import decode_token
from app.db.models import VoiceOfEmployee, UserAccount, Employee
from app.db.session import get_db

router = APIRouter()


def _get_current_user_id(authorization: str = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    return int(payload["sub"])


class VoeSubmitIn(BaseModel):
    message: str


class VoeOut(BaseModel):
    id: int
    submitted_by: str
    department: str
    message: str
    created_at: str | None


@router.post("/submit")
def submit_voe(
    body: VoeSubmitIn,
    db: Session = Depends(get_db),
    authorization: str = Header(None),
):
    user_id = _get_current_user_id(authorization)

    text = body.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    voe = VoiceOfEmployee(
        user_id=user_id,
        message=text,
    )
    db.add(voe)
    db.commit()
    return {"ok": True}


@router.get("/list")
def list_voe(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query("", alias="q"),
    db: Session = Depends(get_db),
    authorization: str = Header(None),
) -> dict:
    _get_current_user_id(authorization)

    query = db.query(VoiceOfEmployee).filter(VoiceOfEmployee.is_deleted == False)

    if search.strip():
        query = query.filter(VoiceOfEmployee.message.ilike(f"%{search.strip()}%"))

    total = query.count()

    rows = (
        query.order_by(VoiceOfEmployee.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items: list[VoeOut] = []
    for r in rows:
        submitted_by = "Anonymous"
        department = ""
        if r.user_id:
            ua = db.query(UserAccount).filter(UserAccount.id == r.user_id).first()
            if ua and ua.employee_id:
                emp = db.query(Employee).filter(Employee.id == ua.employee_id).first()
                if emp:
                    submitted_by = f"{emp.first_name} {emp.last_name}"
                    department = emp.department or ""

        items.append(VoeOut(
            id=r.id,
            submitted_by=submitted_by,
            department=department,
            message=r.message,
            created_at=r.created_at.isoformat() if r.created_at else None,
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
