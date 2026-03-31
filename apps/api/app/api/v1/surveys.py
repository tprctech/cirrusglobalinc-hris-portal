from fastapi import APIRouter

router = APIRouter()


@router.post("/surveys")
def create_survey() -> dict:
    return {"status": "created"}


@router.post("/surveys/{survey_id}/responses")
def submit_response(survey_id: str) -> dict:
    return {"survey_id": survey_id, "accepted": True}


@router.get("/surveys/{survey_id}/results")
def survey_results(survey_id: str) -> dict:
    return {"survey_id": survey_id, "participation_rate": 0.0}
