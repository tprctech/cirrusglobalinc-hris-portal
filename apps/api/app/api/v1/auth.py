import os
from datetime import datetime, timedelta

import bcrypt
import jwt
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import UserAccount, Employee
from app.db.session import get_db

router = APIRouter()

JWT_SECRET = os.environ.get("JWT_SECRET", "cirrus-dev-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
SESSION_DURATION_HOURS = int(os.environ.get("SESSION_DURATION_HOURS", "24"))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(hours=SESSION_DURATION_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


class LoginRequest(BaseModel):
    email: str
    password: str


def default_password() -> str:
    return f"cirrus{datetime.utcnow().year}"


class RegisterRequest(BaseModel):
    email: str
    password: str | None = None
    employee_id: int | None = None
    portal_role: str = "Employee"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


class MeResponse(BaseModel):
    id: int
    email: str
    portal_role: str
    employee: dict | None


def get_current_user_from_header(authorization: str = "") -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization[7:]
    return decode_token(token)


def serialize_employee(emp: Employee) -> dict:
    return {
        "id": emp.id,
        "employeeId": emp.employee_id,
        "firstName": emp.first_name,
        "middleName": emp.middle_name or "",
        "lastName": emp.last_name,
        "email": emp.email or "",
        "phone": emp.phone or "",
        "department": emp.department or "",
        "jobTitle": emp.job_title or "",
        "jobDescription": emp.job_description or "",
        "team": emp.team or "",
        "supervisor": emp.supervisor or "",
        "reviewers": emp.reviewers or "",
        "status": emp.status or "Active",
        "portalRole": emp.teamflect_role or "Employee",
        "country": emp.country or "",
        "officeLocation": emp.office_location or "",
        "birthdate": str(emp.birthdate) if emp.birthdate else "",
        "dateHired": str(emp.date_hired) if emp.date_hired else "",
        "profilePhoto": emp.profile_photo or "",
        "gender": emp.gender or "",
        "maritalStatus": emp.marital_status or "",
        "homeAddress": emp.home_address or "",
    }


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserAccount).filter(UserAccount.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_token(user.id)

    employee_data = None
    if user.employee_id and user.employee:
        employee_data = serialize_employee(user.employee)

    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "portalRole": user.portal_role,
            "employee": employee_data,
        },
    }


@router.get("/me")
def get_me(db: Session = Depends(get_db), authorization: str = Header("")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization[7:]
    data = decode_token(token)
    user = db.query(UserAccount).filter(UserAccount.id == int(data["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    employee_data = None
    if user.employee_id and user.employee:
        employee_data = serialize_employee(user.employee)

    return {
        "id": user.id,
        "email": user.email,
        "portalRole": user.portal_role,
        "employee": employee_data,
    }


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db), authorization: str = Header("")):
    if authorization.startswith("Bearer "):
        token = authorization[7:]
        try:
            caller_data = decode_token(token)
            caller = db.query(UserAccount).filter(UserAccount.id == int(caller_data["sub"])).first()
            if not caller or caller.portal_role not in ("Admin", "HR"):
                raise HTTPException(status_code=403, detail="Only Admin or HR users can register new accounts")
        except HTTPException:
            raise
    else:
        existing_count = db.query(UserAccount).count()
        if existing_count > 0:
            raise HTTPException(status_code=403, detail="Registration requires admin authentication")

    existing = db.query(UserAccount).filter(UserAccount.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    VALID_ROLES = {"employee": "Employee", "manager": "Manager", "hr": "HR", "admin": "Admin"}
    role = VALID_ROLES.get(payload.portal_role.strip().lower(), "Employee")

    if payload.employee_id:
        emp = db.query(Employee).filter(Employee.id == payload.employee_id).first()
        if not emp:
            raise HTTPException(status_code=400, detail="Employee not found")

    pwd = payload.password if payload.password else default_password()

    user = UserAccount(
        email=payload.email,
        password_hash=hash_password(pwd),
        employee_id=payload.employee_id,
        portal_role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"id": user.id, "email": user.email, "portalRole": user.portal_role}


@router.post("/reset-password/{employee_id}")
def reset_password(employee_id: int, db: Session = Depends(get_db), authorization: str = Header("")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization[7:]
    caller_data = decode_token(token)
    caller = db.query(UserAccount).filter(UserAccount.id == int(caller_data["sub"])).first()
    if not caller or caller.portal_role not in ("Admin", "HR"):
        raise HTTPException(status_code=403, detail="Only Admin or HR users can reset passwords")

    user = db.query(UserAccount).filter(UserAccount.employee_id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user account found for this employee")

    new_pwd = default_password()
    user.password_hash = hash_password(new_pwd)
    user.updated_at = datetime.utcnow()
    db.commit()

    return {"message": f"Password reset to default (cirrus{datetime.utcnow().year})", "email": user.email}


@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, db: Session = Depends(get_db), authorization: str = Header("")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization[7:]
    data = decode_token(token)
    user = db.query(UserAccount).filter(UserAccount.id == int(data["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    user.password_hash = hash_password(payload.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Password changed successfully"}
