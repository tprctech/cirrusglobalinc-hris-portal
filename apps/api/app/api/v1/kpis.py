from fastapi import APIRouter, Query

router = APIRouter()


@router.post("/kpis")
def create_kpi() -> dict:
    return {"status": "created"}


@router.patch("/kpis/{kpi_id}")
def update_kpi(kpi_id: str) -> dict:
    return {"kpi_id": kpi_id, "updated": True}


@router.get("/kpis")
def list_kpis(scope: str = Query(default="me", pattern="^(me|team)$")) -> dict:
    return {"scope": scope, "items": []}
