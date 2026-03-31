from fastapi import APIRouter, Request

from app.core.security import Role, require_roles

router = APIRouter()


@router.post("/proxy/start")
def start_proxy(request: Request) -> dict:
    require_roles(request, {Role.ADMIN})
    return {"proxy": "started"}


@router.post("/proxy/stop")
def stop_proxy(request: Request) -> dict:
    require_roles(request, {Role.ADMIN})
    return {"proxy": "stopped"}
