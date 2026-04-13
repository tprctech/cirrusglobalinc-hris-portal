from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import RecognitionBadge, Reward, RewardRedeem
from app.db.session import get_db

router = APIRouter()


class BadgeCreate(BaseModel):
    image: Optional[str] = ""
    title: str
    description: Optional[str] = ""
    is_official: Optional[bool] = False
    point: Optional[int] = 0
    is_active: Optional[bool] = True
    created_by: Optional[str] = ""


class BadgeUpdate(BaseModel):
    image: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    is_official: Optional[bool] = None
    point: Optional[int] = None
    is_active: Optional[bool] = None
    updated_by: Optional[str] = ""


class BadgeOut(BaseModel):
    id: int
    image: str
    title: str
    description: str
    is_official: bool
    point: int
    is_active: bool
    created_by: str
    updated_by: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class RewardCreate(BaseModel):
    reward_name: str
    reward_description: Optional[str] = ""
    redeem_points: Optional[int] = 0
    is_active: Optional[bool] = True
    created_by: Optional[str] = ""


class RewardUpdate(BaseModel):
    reward_name: Optional[str] = None
    reward_description: Optional[str] = None
    redeem_points: Optional[int] = None
    is_active: Optional[bool] = None
    updated_by: Optional[str] = ""


class RewardOut(BaseModel):
    id: int
    reward_name: str
    reward_description: str
    redeem_points: int
    is_active: bool
    created_by: str
    updated_by: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class RedeemCreate(BaseModel):
    requested_by: str
    user_mail: Optional[str] = ""
    reward_name: str
    reward_points: Optional[int] = 0
    redeem_date: Optional[date] = None
    status: Optional[str] = "Pending"


class RedeemUpdate(BaseModel):
    status: Optional[str] = None


class RedeemOut(BaseModel):
    id: int
    requested_by: str
    user_mail: str
    reward_name: str
    reward_points: int
    redeem_date: Optional[date]
    status: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.get("/badges", response_model=list[BadgeOut])
def list_badges(db: Session = Depends(get_db)):
    return db.query(RecognitionBadge).filter(RecognitionBadge.is_deleted == False).order_by(RecognitionBadge.id).all()


@router.get("/badges/{badge_id}", response_model=BadgeOut)
def get_badge(badge_id: int, db: Session = Depends(get_db)):
    row = db.query(RecognitionBadge).filter(RecognitionBadge.id == badge_id, RecognitionBadge.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Badge not found")
    return row


@router.post("/badges", response_model=BadgeOut, status_code=201)
def create_badge(payload: BadgeCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    data["updated_by"] = data.get("created_by", "")
    row = RecognitionBadge(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/badges/{badge_id}", response_model=BadgeOut)
def update_badge(badge_id: int, payload: BadgeUpdate, db: Session = Depends(get_db)):
    row = db.query(RecognitionBadge).filter(RecognitionBadge.id == badge_id, RecognitionBadge.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Badge not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/badges/{badge_id}", status_code=204)
def delete_badge(badge_id: int, updated_by: str = "", db: Session = Depends(get_db)):
    row = db.query(RecognitionBadge).filter(RecognitionBadge.id == badge_id, RecognitionBadge.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Badge not found")
    row.is_active = False
    row.is_deleted = True
    row.updated_by = updated_by
    db.commit()


@router.get("/rewards", response_model=list[RewardOut])
def list_rewards(db: Session = Depends(get_db)):
    return db.query(Reward).filter(Reward.is_deleted == False).order_by(Reward.id).all()


@router.get("/rewards/{reward_id}", response_model=RewardOut)
def get_reward(reward_id: int, db: Session = Depends(get_db)):
    row = db.query(Reward).filter(Reward.id == reward_id, Reward.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Reward not found")
    return row


@router.post("/rewards", response_model=RewardOut, status_code=201)
def create_reward(payload: RewardCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    data["updated_by"] = data.get("created_by", "")
    row = Reward(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/rewards/{reward_id}", response_model=RewardOut)
def update_reward(reward_id: int, payload: RewardUpdate, db: Session = Depends(get_db)):
    row = db.query(Reward).filter(Reward.id == reward_id, Reward.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Reward not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/rewards/{reward_id}", status_code=204)
def delete_reward(reward_id: int, updated_by: str = "", db: Session = Depends(get_db)):
    row = db.query(Reward).filter(Reward.id == reward_id, Reward.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Reward not found")
    row.is_active = False
    row.is_deleted = True
    row.updated_by = updated_by
    db.commit()


@router.get("/redeems", response_model=list[RedeemOut])
def list_redeems(status_filter: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(RewardRedeem).filter(RewardRedeem.is_deleted == False)
    if status_filter:
        q = q.filter(RewardRedeem.status == status_filter)
    if search:
        q = q.filter(RewardRedeem.requested_by.ilike(f"%{search}%"))
    return q.order_by(RewardRedeem.id.desc()).all()


@router.post("/redeems", response_model=RedeemOut, status_code=201)
def create_redeem(payload: RedeemCreate, db: Session = Depends(get_db)):
    row = RewardRedeem(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/redeems/{redeem_id}", response_model=RedeemOut)
def update_redeem(redeem_id: int, payload: RedeemUpdate, db: Session = Depends(get_db)):
    row = db.query(RewardRedeem).filter(RewardRedeem.id == redeem_id, RewardRedeem.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Redeem not found")
    if payload.status is not None:
        row.status = payload.status
    db.commit()
    db.refresh(row)
    return row


@router.delete("/redeems/{redeem_id}", status_code=204)
def delete_redeem(redeem_id: int, db: Session = Depends(get_db)):
    row = db.query(RewardRedeem).filter(RewardRedeem.id == redeem_id, RewardRedeem.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Redeem not found")
    row.is_deleted = True
    db.commit()
