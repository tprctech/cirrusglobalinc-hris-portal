from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.auth import decode_token
from app.db.models import Notification, UserAccount
from app.db.session import get_db

router = APIRouter()


def _get_current_user_id(authorization: str = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    return int(payload["sub"])


class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    message: str
    link: str | None
    is_read: bool
    created_at: str | None


@router.get("")
def list_notifications(
    db: Session = Depends(get_db),
    authorization: str = Header(None),
) -> list[NotificationOut]:
    user_id = _get_current_user_id(authorization)

    rows = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.is_deleted == False,
        )
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )

    return [
        NotificationOut(
            id=r.id,
            type=r.type,
            title=r.title,
            message=r.message,
            link=r.link,
            is_read=r.is_read,
            created_at=r.created_at.isoformat() if r.created_at else None,
        )
        for r in rows
    ]


@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    authorization: str = Header(None),
):
    user_id = _get_current_user_id(authorization)

    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id,
        Notification.is_deleted == False,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    return {"ok": True}


@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    authorization: str = Header(None),
):
    user_id = _get_current_user_id(authorization)

    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,
        Notification.is_deleted == False,
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}
