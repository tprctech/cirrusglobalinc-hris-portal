from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from sqlalchemy import func
from app.db.models import Reward, RewardRedeem, Employee, RecognitionGiven, UserAccount
from app.db.session import get_db

router = APIRouter()


def _get_current_user(request: Request):
    import jwt, os
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, ""
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, os.environ.get("JWT_SECRET", "cirrus-dev-secret-change-in-prod"), algorithms=["HS256"])
        user_id = int(payload.get("sub", 0))
    except Exception:
        return None, ""
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        ua = db.query(UserAccount).filter(UserAccount.id == user_id).first()
        if not ua:
            return None, ""
        if not ua.employee_id:
            return None, ua.email
        emp = db.query(Employee).filter(Employee.id == ua.employee_id).first()
        return emp, emp.email if emp else ua.email
    finally:
        db.close()


class RewardCatalogOut(BaseModel):
    id: int
    reward_name: str
    reward_description: str
    redeem_points: int

    class Config:
        from_attributes = True


class RedeemOut(BaseModel):
    id: int
    reward_name: str
    reward_points: int
    redeem_date: Optional[date]
    status: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.get("/catalog")
def rewards_catalog(db: Session = Depends(get_db)) -> list[RewardCatalogOut]:
    rows = (
        db.query(Reward)
        .filter(Reward.is_deleted == False, Reward.is_active == True)
        .order_by(Reward.id)
        .all()
    )
    return [RewardCatalogOut.model_validate(r) for r in rows]


@router.post("/{reward_id}/redeem")
def redeem_reward(reward_id: int, request: Request, db: Session = Depends(get_db)) -> RedeemOut:
    emp, email = _get_current_user(request)
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated")

    reward = db.query(Reward).filter(
        Reward.id == reward_id,
        Reward.is_deleted == False,
        Reward.is_active == True,
    ).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    earned = (
        db.query(func.coalesce(func.sum(RecognitionGiven.points), 0))
        .filter(RecognitionGiven.to_email == email, RecognitionGiven.is_deleted == False)
        .scalar()
    )
    spent = (
        db.query(func.coalesce(func.sum(RewardRedeem.reward_points), 0))
        .filter(
            RewardRedeem.user_mail == email,
            RewardRedeem.is_deleted == False,
            RewardRedeem.status != "Rejected",
        )
        .scalar()
    )
    available = earned - spent
    if reward.redeem_points > available:
        raise HTTPException(status_code=400, detail="Insufficient points")

    name = f"{emp.first_name} {emp.last_name}" if emp else email

    redeem = RewardRedeem(
        requested_by=name,
        user_mail=email,
        reward_name=reward.reward_name,
        reward_points=reward.redeem_points,
        redeem_date=date.today(),
        status="Pending",
    )
    db.add(redeem)
    db.commit()
    db.refresh(redeem)
    return RedeemOut.model_validate(redeem)


@router.get("/my-redeems")
def my_redeems(request: Request, db: Session = Depends(get_db)) -> list[RedeemOut]:
    _, email = _get_current_user(request)
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated")
    rows = (
        db.query(RewardRedeem)
        .filter(RewardRedeem.user_mail == email, RewardRedeem.is_deleted == False)
        .order_by(RewardRedeem.id.desc())
        .all()
    )
    return [RedeemOut.model_validate(r) for r in rows]
