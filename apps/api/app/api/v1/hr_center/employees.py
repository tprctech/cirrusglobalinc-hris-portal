import io
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from PIL import Image
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import Employee, UserAccount
from app.db.session import get_db

router = APIRouter()

PHOTO_MAX_SIZE = (400, 400)

VALID_PORTAL_ROLES = {"employee": "Employee", "manager": "Manager", "hr": "HR", "admin": "Admin"}


def normalize_role(role: str | None) -> str:
    if not role:
        return "Employee"
    mapped = VALID_PORTAL_ROLES.get(role.strip().lower())
    return mapped if mapped else "Employee"


class EmployeeCreate(BaseModel):
    employee_id: str
    first_name: str
    middle_name: Optional[str] = ""
    last_name: str
    display_name: Optional[str] = ""
    birthdate: Optional[date] = None
    gender: Optional[str] = ""
    marital_status: Optional[str] = ""
    home_address: Optional[str] = ""
    permanent_address: Optional[str] = ""
    team: Optional[str] = ""
    regularization_date: Optional[date] = None
    department: Optional[str] = ""
    job_title: Optional[str] = ""
    job_description: Optional[str] = ""
    teamflect_role: Optional[str] = "Employee"
    date_hired: Optional[date] = None
    status: Optional[str] = "Active"
    supervisor: Optional[str] = ""
    reviewers: Optional[str] = ""
    sss_number: Optional[str] = ""
    hdmf_number: Optional[str] = ""
    phil_health_number: Optional[str] = ""
    tin: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    country: Optional[str] = ""
    office_location: Optional[str] = ""
    profile_photo: Optional[str] = ""


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    birthdate: Optional[date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    home_address: Optional[str] = None
    permanent_address: Optional[str] = None
    team: Optional[str] = None
    regularization_date: Optional[date] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    teamflect_role: Optional[str] = None
    date_hired: Optional[date] = None
    status: Optional[str] = None
    supervisor: Optional[str] = None
    reviewers: Optional[str] = None
    sss_number: Optional[str] = None
    hdmf_number: Optional[str] = None
    phil_health_number: Optional[str] = None
    tin: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    office_location: Optional[str] = None
    profile_photo: Optional[str] = None


class EmployeeOut(BaseModel):
    id: int
    employee_id: str
    first_name: str
    middle_name: str
    last_name: str
    display_name: str
    birthdate: Optional[date]
    gender: str
    marital_status: str
    home_address: str
    permanent_address: str
    team: str
    regularization_date: Optional[date]
    department: str
    job_title: str
    job_description: str
    teamflect_role: str
    date_hired: Optional[date]
    status: str
    supervisor: str
    reviewers: str
    sss_number: str
    hdmf_number: str
    phil_health_number: str
    tin: str
    email: str
    phone: str
    country: str
    office_location: str
    profile_photo: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


def _row_to_dict(row: Employee) -> dict:
    return {c.name: getattr(row, c.name) for c in row.__table__.columns}


@router.get("/", response_model=list[EmployeeOut])
def list_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    rows = db.query(Employee).offset(skip).limit(limit).all()
    return rows


@router.get("/search/lookup")
def search_employees(q: str = "", db: Session = Depends(get_db)):
    if not q or len(q) < 1:
        rows = db.query(Employee).limit(20).all()
    else:
        term = f"%{q}%"
        rows = db.query(Employee).filter(
            (Employee.first_name.ilike(term)) |
            (Employee.last_name.ilike(term)) |
            (Employee.display_name.ilike(term)) |
            (Employee.email.ilike(term))
        ).limit(20).all()
    return [
        {
            "id": r.id,
            "employee_id": r.employee_id,
            "first_name": r.first_name,
            "middle_name": r.middle_name or "",
            "last_name": r.last_name,
            "display_name": r.display_name or "",
            "email": r.email or "",
        }
        for r in rows
    ]


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    row = db.query(Employee).filter(Employee.id == employee_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Employee not found")
    return row


@router.post("/", response_model=EmployeeOut, status_code=201)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    data["teamflect_role"] = normalize_role(data.get("teamflect_role"))
    row = Employee(**data)
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Employee with this employee_id already exists")
    db.refresh(row)
    return row


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    row = db.query(Employee).filter(Employee.id == employee_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Employee not found")
    updates = payload.model_dump(exclude_unset=True)
    if "teamflect_role" in updates:
        updates["teamflect_role"] = normalize_role(updates["teamflect_role"])
    for key, value in updates.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{employee_id}", status_code=204)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    row = db.query(Employee).filter(Employee.id == employee_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Employee not found")
    acct_count = db.query(UserAccount).filter(UserAccount.employee_id == employee_id).count()
    if acct_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete this employee because they have a linked user account. Remove the user account first.",
        )
    db.delete(row)
    db.commit()


@router.post("/{employee_id}/photo", response_model=EmployeeOut)
def upload_photo(employee_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    row = db.query(Employee).filter(Employee.id == employee_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Employee not found")
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are accepted")
    import base64
    contents = file.file.read()
    img = Image.open(io.BytesIO(contents))
    img = img.convert("RGB")
    img.thumbnail(PHOTO_MAX_SIZE, Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    row.profile_photo = f"data:image/jpeg;base64,{b64}"
    db.commit()
    db.refresh(row)
    return row
