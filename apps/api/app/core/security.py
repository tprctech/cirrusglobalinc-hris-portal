from enum import StrEnum
from fastapi import HTTPException, Request, status


class Role(StrEnum):
    EMPLOYEE = "employee"
    MANAGER = "manager"
    ADMIN = "admin"


def get_role(request: Request) -> Role:
    role_value = request.headers.get("x-role", Role.EMPLOYEE)
    try:
        return Role(role_value)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid role") from exc


def require_roles(request: Request, allowed: set[Role]) -> None:
    role = get_role(request)
    if role not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")


def proxy_mode(request: Request) -> bool:
    return request.headers.get("x-proxy-user") is not None


def block_proxy_access_to_anonymous(request: Request) -> None:
    if proxy_mode(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Proxy mode cannot access anonymous identity context"
        )
