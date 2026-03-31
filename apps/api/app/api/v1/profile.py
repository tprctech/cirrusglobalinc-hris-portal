from fastapi import APIRouter

router = APIRouter()


@router.get("/me")
def get_me() -> dict:
    return {"id": "u-123", "name": "Demo User", "role": "employee"}


@router.get("/users/{user_id}")
def get_user(user_id: str) -> dict:
    return {"id": user_id}


@router.get("/teams/{manager_id}")
def get_team(manager_id: str) -> dict:
    return {"manager_id": manager_id, "members": []}
