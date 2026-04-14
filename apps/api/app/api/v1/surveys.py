from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import (
    SurveyCampaign, SurveyResponse, SurveyResponseAnswer,
    SurveyTemplate, SurveyTemplateSection, SurveyTemplateQuestion,
)
from app.db.session import get_db

router = APIRouter()


class AnswerIn(BaseModel):
    question_id: int
    section_id: int
    answer_text: Optional[str] = ""
    rating: Optional[int] = None
    selected_options: Optional[str] = ""


class CampaignCreate(BaseModel):
    template_id: Optional[int] = None
    title: str
    scope: Optional[str] = "All Employees"
    due_date: Optional[str] = None
    created_by_email: Optional[str] = ""


class CampaignOut(BaseModel):
    id: int
    template_id: Optional[int]
    title: str
    scope: str
    due_date: Optional[date]
    status: str
    created_by_email: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class QuestionOut(BaseModel):
    id: int
    prompt: str
    question_type: str
    options: str
    required: bool
    sort_order: int

    class Config:
        from_attributes = True


class SectionOut(BaseModel):
    id: int
    label: str
    sort_order: int
    questions: list[QuestionOut]

    class Config:
        from_attributes = True


class CampaignDetailOut(BaseModel):
    id: int
    template_id: Optional[int]
    title: str
    scope: str
    due_date: Optional[date]
    status: str
    sections: list[SectionOut]

    class Config:
        from_attributes = True


class AnswerOut(BaseModel):
    id: int
    question_id: int
    section_id: int
    answer_text: str
    rating: Optional[int]
    selected_options: str

    class Config:
        from_attributes = True


class ResponseOut(BaseModel):
    id: int
    campaign_id: int
    respondent_email: str
    status: str
    submitted_at: Optional[datetime]
    answers: list[AnswerOut]

    class Config:
        from_attributes = True


class ResponseCreate(BaseModel):
    respondent_email: str
    status: Optional[str] = "Draft"
    answers: list[AnswerIn] = []


@router.post("/survey-campaigns")
def create_campaign(payload: CampaignCreate, db: Session = Depends(get_db)) -> CampaignOut:
    due = None
    if payload.due_date:
        try:
            due = date.fromisoformat(payload.due_date)
        except ValueError:
            due = None

    campaign = SurveyCampaign(
        template_id=payload.template_id,
        title=payload.title,
        scope=payload.scope or "All Employees",
        due_date=due,
        status="Active",
        created_by_email=payload.created_by_email or "",
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return CampaignOut.model_validate(campaign)


@router.get("/survey-campaigns")
def list_campaigns(db: Session = Depends(get_db)) -> list[CampaignOut]:
    campaigns = (
        db.query(SurveyCampaign)
        .filter(SurveyCampaign.is_deleted == False)
        .order_by(SurveyCampaign.id.desc())
        .all()
    )
    return [CampaignOut.model_validate(c) for c in campaigns]


@router.get("/survey-campaigns/{campaign_id}")
def get_campaign(campaign_id: int, db: Session = Depends(get_db)) -> CampaignDetailOut:
    campaign = (
        db.query(SurveyCampaign)
        .filter(SurveyCampaign.id == campaign_id, SurveyCampaign.is_deleted == False)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Survey campaign not found")

    sections: list[SectionOut] = []
    if campaign.template_id:
        template = db.query(SurveyTemplate).filter(SurveyTemplate.id == campaign.template_id).first()
        if template:
            for sec in sorted(template.sections, key=lambda s: s.sort_order):
                questions = [
                    QuestionOut.model_validate(q)
                    for q in sorted(sec.questions, key=lambda q: q.sort_order)
                ]
                sections.append(SectionOut(id=sec.id, label=sec.label, sort_order=sec.sort_order, questions=questions))

    return CampaignDetailOut(
        id=campaign.id,
        template_id=campaign.template_id,
        title=campaign.title,
        scope=campaign.scope,
        due_date=campaign.due_date,
        status=campaign.status,
        sections=sections,
    )


@router.post("/survey-campaigns/{campaign_id}/responses")
def save_survey_response(campaign_id: int, payload: ResponseCreate, db: Session = Depends(get_db)) -> ResponseOut:
    campaign = (
        db.query(SurveyCampaign)
        .filter(SurveyCampaign.id == campaign_id, SurveyCampaign.is_deleted == False)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Survey campaign not found")

    existing = (
        db.query(SurveyResponse)
        .filter(
            SurveyResponse.campaign_id == campaign_id,
            SurveyResponse.respondent_email == payload.respondent_email,
            SurveyResponse.is_deleted == False,
        )
        .first()
    )

    if existing:
        existing.status = payload.status or "Draft"
        if payload.status == "Submitted":
            existing.submitted_at = datetime.utcnow()
        for old_answer in existing.answers:
            db.delete(old_answer)
        db.flush()
        for ans in payload.answers:
            existing.answers.append(
                SurveyResponseAnswer(
                    question_id=ans.question_id,
                    section_id=ans.section_id,
                    answer_text=ans.answer_text or "",
                    rating=ans.rating,
                    selected_options=ans.selected_options or "",
                )
            )
        db.commit()
        db.refresh(existing)
        return ResponseOut.model_validate(existing)

    response = SurveyResponse(
        campaign_id=campaign_id,
        respondent_email=payload.respondent_email,
        status=payload.status or "Draft",
        submitted_at=datetime.utcnow() if payload.status == "Submitted" else None,
    )
    for ans in payload.answers:
        response.answers.append(
            SurveyResponseAnswer(
                question_id=ans.question_id,
                section_id=ans.section_id,
                answer_text=ans.answer_text or "",
                rating=ans.rating,
                selected_options=ans.selected_options or "",
            )
        )
    db.add(response)
    db.commit()
    db.refresh(response)
    return ResponseOut.model_validate(response)


@router.get("/survey-campaigns/{campaign_id}/responses")
def list_survey_responses(campaign_id: int, db: Session = Depends(get_db)) -> list[ResponseOut]:
    responses = (
        db.query(SurveyResponse)
        .filter(SurveyResponse.campaign_id == campaign_id, SurveyResponse.is_deleted == False)
        .all()
    )
    return [ResponseOut.model_validate(r) for r in responses]


class CampaignStatusUpdate(BaseModel):
    status: str


@router.patch("/survey-campaigns/{campaign_id}/status")
def update_campaign_status(campaign_id: int, payload: CampaignStatusUpdate, db: Session = Depends(get_db)) -> CampaignOut:
    if payload.status not in ("Active", "Inactive"):
        raise HTTPException(status_code=400, detail="Status must be 'Active' or 'Inactive'")
    campaign = (
        db.query(SurveyCampaign)
        .filter(SurveyCampaign.id == campaign_id, SurveyCampaign.is_deleted == False)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Survey campaign not found")
    campaign.status = payload.status
    db.commit()
    db.refresh(campaign)
    return CampaignOut.model_validate(campaign)


@router.get("/surveys/{survey_id}/results")
def survey_results(survey_id: str) -> dict:
    return {"survey_id": survey_id, "participation_rate": 0.0}
