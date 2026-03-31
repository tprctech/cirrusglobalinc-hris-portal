from fastapi import APIRouter

router = APIRouter()


@router.get("/catalog")
def rewards_catalog() -> dict:
    return {"items": []}


@router.post("/{reward_id}/redeem")
def redeem_reward(reward_id: str) -> dict:
    return {"reward_id": reward_id, "redeemed": True}
