from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import (
    ReviewQuestionSet, ReviewQuestionSetQuestion, ReviewQuestionSetSection,
    ReviewTemplate, ReviewTemplateQuestion, ReviewTemplateSection,
)
from app.db.session import get_db

router = APIRouter()


class QuestionIn(BaseModel):
    prompt: str
    question_type: Optional[str] = "Long Answer"
    options: Optional[str] = ""
    required: Optional[bool] = False
    sort_order: Optional[int] = 0


class SectionIn(BaseModel):
    label: str
    sort_order: Optional[int] = 0
    questions: Optional[list[QuestionIn]] = []


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


class TemplateCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    sections: Optional[list[SectionIn]] = []


class TemplateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    sections: Optional[list[SectionIn]] = None


class TemplateOut(BaseModel):
    id: int
    title: str
    description: str
    sections: list[SectionOut]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class QuestionSetCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    sections: Optional[list[SectionIn]] = []


class QuestionSetUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    sections: Optional[list[SectionIn]] = None


class QuestionSetOut(BaseModel):
    id: int
    title: str
    description: str
    sections: list[SectionOut]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


def _build_template_sections(sections_data: list[SectionIn]) -> list[ReviewTemplateSection]:
    result = []
    for s in sections_data:
        section = ReviewTemplateSection(label=s.label, sort_order=s.sort_order)
        for q in (s.questions or []):
            section.questions.append(ReviewTemplateQuestion(
                prompt=q.prompt, question_type=q.question_type or "Long Answer",
                options=q.options or "", required=q.required or False, sort_order=q.sort_order or 0,
            ))
        result.append(section)
    return result


def _build_qs_sections(sections_data: list[SectionIn]) -> list[ReviewQuestionSetSection]:
    result = []
    for s in sections_data:
        section = ReviewQuestionSetSection(label=s.label, sort_order=s.sort_order)
        for q in (s.questions or []):
            section.questions.append(ReviewQuestionSetQuestion(
                prompt=q.prompt, question_type=q.question_type or "Long Answer",
                options=q.options or "", required=q.required or False, sort_order=q.sort_order or 0,
            ))
        result.append(section)
    return result


@router.get("/templates", response_model=list[TemplateOut])
def list_review_templates(db: Session = Depends(get_db)):
    return db.query(ReviewTemplate).order_by(ReviewTemplate.id).all()


@router.get("/templates/{template_id}", response_model=TemplateOut)
def get_review_template(template_id: int, db: Session = Depends(get_db)):
    row = db.query(ReviewTemplate).filter(ReviewTemplate.id == template_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Review template not found")
    return row


@router.post("/templates", response_model=TemplateOut, status_code=201)
def create_review_template(payload: TemplateCreate, db: Session = Depends(get_db)):
    row = ReviewTemplate(title=payload.title, description=payload.description or "")
    row.sections = _build_template_sections(payload.sections or [])
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/templates/{template_id}", response_model=TemplateOut)
def update_review_template(template_id: int, payload: TemplateUpdate, db: Session = Depends(get_db)):
    row = db.query(ReviewTemplate).filter(ReviewTemplate.id == template_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Review template not found")
    if payload.title is not None:
        row.title = payload.title
    if payload.description is not None:
        row.description = payload.description
    if payload.sections is not None:
        row.sections.clear()
        row.sections = _build_template_sections(payload.sections)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/templates/{template_id}", status_code=204)
def delete_review_template(template_id: int, db: Session = Depends(get_db)):
    row = db.query(ReviewTemplate).filter(ReviewTemplate.id == template_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Review template not found")
    db.delete(row)
    db.commit()


@router.get("/question-sets", response_model=list[QuestionSetOut])
def list_review_question_sets(db: Session = Depends(get_db)):
    return db.query(ReviewQuestionSet).order_by(ReviewQuestionSet.id).all()


@router.get("/question-sets/{qs_id}", response_model=QuestionSetOut)
def get_review_question_set(qs_id: int, db: Session = Depends(get_db)):
    row = db.query(ReviewQuestionSet).filter(ReviewQuestionSet.id == qs_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Review question set not found")
    return row


@router.post("/question-sets", response_model=QuestionSetOut, status_code=201)
def create_review_question_set(payload: QuestionSetCreate, db: Session = Depends(get_db)):
    row = ReviewQuestionSet(title=payload.title, description=payload.description or "")
    row.sections = _build_qs_sections(payload.sections or [])
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/question-sets/{qs_id}", response_model=QuestionSetOut)
def update_review_question_set(qs_id: int, payload: QuestionSetUpdate, db: Session = Depends(get_db)):
    row = db.query(ReviewQuestionSet).filter(ReviewQuestionSet.id == qs_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Review question set not found")
    if payload.title is not None:
        row.title = payload.title
    if payload.description is not None:
        row.description = payload.description
    if payload.sections is not None:
        row.sections.clear()
        row.sections = _build_qs_sections(payload.sections)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/question-sets/{qs_id}", status_code=204)
def delete_review_question_set(qs_id: int, db: Session = Depends(get_db)):
    row = db.query(ReviewQuestionSet).filter(ReviewQuestionSet.id == qs_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Review question set not found")
    db.delete(row)
    db.commit()
