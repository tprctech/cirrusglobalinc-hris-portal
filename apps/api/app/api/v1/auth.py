from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

from app.schemas.common import Message

router = APIRouter()


class InviteRequest(BaseModel):
    email: EmailStr
    role: str


@router.post("/invite", response_model=Message)
def invite_user(payload: InviteRequest) -> Message:
    return Message(message=f"Invite queued for {payload.email}")


@router.post("/verify", response_model=Message)
def verify_user() -> Message:
    return Message(message="Account verified")


@router.post("/password/reset", response_model=Message)
def reset_password() -> Message:
    return Message(message="Password reset initiated")
