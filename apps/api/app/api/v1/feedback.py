from fastapi import APIRouter, Request

from app.core.security import block_proxy_access_to_anonymous

router = APIRouter()


@router.post("/company-anonymous")
def create_company_feedback() -> dict:
    return {"accepted": True}


@router.post("/employee")
def create_employee_feedback() -> dict:
    return {"accepted": True}


@router.get("/received")
def list_received_feedback() -> dict:
    return {"items": []}


@router.get("/given")
def list_given_feedback(request: Request) -> dict:
    block_proxy_access_to_anonymous(request)
    return {"items": []}
