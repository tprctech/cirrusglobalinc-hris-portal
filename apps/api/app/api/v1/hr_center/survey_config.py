from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import (
    SurveyQuestionSet, SurveyQuestionSetQuestion, SurveyQuestionSetSection,
    SurveyTemplate, SurveyTemplateQuestion, SurveyTemplateSection,
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


def _build_template_sections(sections_data: list[SectionIn]) -> list[SurveyTemplateSection]:
    result = []
    for s in sections_data:
        section = SurveyTemplateSection(label=s.label, sort_order=s.sort_order)
        for q in (s.questions or []):
            section.questions.append(SurveyTemplateQuestion(
                prompt=q.prompt, question_type=q.question_type or "Long Answer",
                options=q.options or "", required=q.required or False, sort_order=q.sort_order or 0,
            ))
        result.append(section)
    return result


def _build_qs_sections(sections_data: list[SectionIn]) -> list[SurveyQuestionSetSection]:
    result = []
    for s in sections_data:
        section = SurveyQuestionSetSection(label=s.label, sort_order=s.sort_order)
        for q in (s.questions or []):
            section.questions.append(SurveyQuestionSetQuestion(
                prompt=q.prompt, question_type=q.question_type or "Long Answer",
                options=q.options or "", required=q.required or False, sort_order=q.sort_order or 0,
            ))
        result.append(section)
    return result


@router.get("/templates", response_model=list[TemplateOut])
def list_survey_templates(db: Session = Depends(get_db)):
    return db.query(SurveyTemplate).filter(SurveyTemplate.is_deleted == False).order_by(SurveyTemplate.id).all()


@router.get("/templates/{template_id}", response_model=TemplateOut)
def get_survey_template(template_id: int, db: Session = Depends(get_db)):
    row = db.query(SurveyTemplate).filter(SurveyTemplate.id == template_id, SurveyTemplate.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Survey template not found")
    return row


@router.post("/templates", response_model=TemplateOut, status_code=201)
def create_survey_template(payload: TemplateCreate, db: Session = Depends(get_db)):
    row = SurveyTemplate(title=payload.title, description=payload.description or "")
    row.sections = _build_template_sections(payload.sections or [])
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/templates/{template_id}", response_model=TemplateOut)
def update_survey_template(template_id: int, payload: TemplateUpdate, db: Session = Depends(get_db)):
    row = db.query(SurveyTemplate).filter(SurveyTemplate.id == template_id, SurveyTemplate.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Survey template not found")
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
def delete_survey_template(template_id: int, db: Session = Depends(get_db)):
    row = db.query(SurveyTemplate).filter(SurveyTemplate.id == template_id, SurveyTemplate.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Survey template not found")
    row.is_deleted = True
    db.commit()


@router.get("/question-sets", response_model=list[QuestionSetOut])
def list_survey_question_sets(db: Session = Depends(get_db)):
    return db.query(SurveyQuestionSet).filter(SurveyQuestionSet.is_deleted == False).order_by(SurveyQuestionSet.id).all()


@router.get("/question-sets/{qs_id}", response_model=QuestionSetOut)
def get_survey_question_set(qs_id: int, db: Session = Depends(get_db)):
    row = db.query(SurveyQuestionSet).filter(SurveyQuestionSet.id == qs_id, SurveyQuestionSet.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Survey question set not found")
    return row


@router.post("/question-sets", response_model=QuestionSetOut, status_code=201)
def create_survey_question_set(payload: QuestionSetCreate, db: Session = Depends(get_db)):
    row = SurveyQuestionSet(title=payload.title, description=payload.description or "")
    row.sections = _build_qs_sections(payload.sections or [])
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/question-sets/{qs_id}", response_model=QuestionSetOut)
def update_survey_question_set(qs_id: int, payload: QuestionSetUpdate, db: Session = Depends(get_db)):
    row = db.query(SurveyQuestionSet).filter(SurveyQuestionSet.id == qs_id, SurveyQuestionSet.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Survey question set not found")
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
def delete_survey_question_set(qs_id: int, db: Session = Depends(get_db)):
    row = db.query(SurveyQuestionSet).filter(SurveyQuestionSet.id == qs_id, SurveyQuestionSet.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Survey question set not found")
    row.is_deleted = True
    db.commit()
