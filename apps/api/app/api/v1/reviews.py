from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import (
    ReviewCycle, ReviewResponse, ReviewResponseAnswer,
    ReviewTemplate, ReviewTemplateSection, ReviewTemplateQuestion,
)
from app.db.session import get_db

router = APIRouter()


class AnswerIn(BaseModel):
    question_id: int
    section_id: int
    answer_text: Optional[str] = ""
    rating: Optional[int] = None
    selected_options: Optional[str] = ""


class CycleCreate(BaseModel):
    template_id: Optional[int] = None
    title: str
    reviewee_email: str
    reviewer_email: Optional[str] = ""
    due_date: Optional[str] = None


class CycleOut(BaseModel):
    id: int
    template_id: Optional[int]
    title: str
    reviewee_email: str
    reviewer_email: str
    due_date: Optional[date]
    status: str
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


class CycleDetailOut(BaseModel):
    id: int
    template_id: Optional[int]
    title: str
    reviewee_email: str
    reviewer_email: str
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
    cycle_id: int
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


@router.post("/review-cycles")
def create_review_cycle(payload: CycleCreate, db: Session = Depends(get_db)) -> CycleOut:
    due = None
    if payload.due_date:
        try:
            due = date.fromisoformat(payload.due_date)
        except ValueError:
            due = None

    cycle = ReviewCycle(
        template_id=payload.template_id,
        title=payload.title,
        reviewee_email=payload.reviewee_email,
        reviewer_email=payload.reviewer_email or "",
        due_date=due,
        status="Pending",
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return CycleOut.model_validate(cycle)


@router.get("/review-cycles")
def list_review_cycles(db: Session = Depends(get_db)) -> list[CycleOut]:
    cycles = db.query(ReviewCycle).filter(ReviewCycle.is_deleted == False).order_by(ReviewCycle.id.desc()).all()
    return [CycleOut.model_validate(c) for c in cycles]


@router.get("/review-cycles/{cycle_id}")
def get_review_cycle(cycle_id: int, db: Session = Depends(get_db)) -> CycleDetailOut:
    cycle = db.query(ReviewCycle).filter(ReviewCycle.id == cycle_id, ReviewCycle.is_deleted == False).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Review cycle not found")

    sections: list[SectionOut] = []
    if cycle.template_id:
        template = db.query(ReviewTemplate).filter(ReviewTemplate.id == cycle.template_id).first()
        if template:
            for sec in sorted(template.sections, key=lambda s: s.sort_order):
                questions = [
                    QuestionOut.model_validate(q)
                    for q in sorted(sec.questions, key=lambda q: q.sort_order)
                ]
                sections.append(SectionOut(id=sec.id, label=sec.label, sort_order=sec.sort_order, questions=questions))

    return CycleDetailOut(
        id=cycle.id,
        template_id=cycle.template_id,
        title=cycle.title,
        reviewee_email=cycle.reviewee_email,
        reviewer_email=cycle.reviewer_email,
        due_date=cycle.due_date,
        status=cycle.status,
        sections=sections,
    )


@router.post("/review-cycles/{cycle_id}/responses")
def save_review_response(cycle_id: int, payload: ResponseCreate, db: Session = Depends(get_db)) -> ResponseOut:
    cycle = db.query(ReviewCycle).filter(ReviewCycle.id == cycle_id, ReviewCycle.is_deleted == False).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Review cycle not found")

    existing = (
        db.query(ReviewResponse)
        .filter(
            ReviewResponse.cycle_id == cycle_id,
            ReviewResponse.respondent_email == payload.respondent_email,
            ReviewResponse.is_deleted == False,
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
                ReviewResponseAnswer(
                    question_id=ans.question_id,
                    section_id=ans.section_id,
                    answer_text=ans.answer_text or "",
                    rating=ans.rating,
                    selected_options=ans.selected_options or "",
                )
            )
        if payload.status == "Submitted":
            cycle.status = "Completed"
        db.commit()
        db.refresh(existing)
        return ResponseOut.model_validate(existing)

    response = ReviewResponse(
        cycle_id=cycle_id,
        respondent_email=payload.respondent_email,
        status=payload.status or "Draft",
        submitted_at=datetime.utcnow() if payload.status == "Submitted" else None,
    )
    for ans in payload.answers:
        response.answers.append(
            ReviewResponseAnswer(
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

    if payload.status == "Submitted":
        cycle.status = "Completed"
        db.commit()

    return ResponseOut.model_validate(response)


@router.get("/review-cycles/{cycle_id}/responses")
def list_review_responses(cycle_id: int, db: Session = Depends(get_db)) -> list[ResponseOut]:
    responses = (
        db.query(ReviewResponse)
        .filter(ReviewResponse.cycle_id == cycle_id, ReviewResponse.is_deleted == False)
        .all()
    )
    return [ResponseOut.model_validate(r) for r in responses]


@router.get("/reviews/{review_id}/export")
def export_review(review_id: str) -> dict:
    return {"review_id": review_id, "export_url": "s3://cph-exports/demo.pdf"}
