import io
import math
import re
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
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
    rows = db.query(Employee).filter(Employee.is_deleted == False).offset(skip).limit(limit).all()
    return rows


@router.get("/search/lookup")
def search_employees(q: str = "", db: Session = Depends(get_db)):
    base = db.query(Employee).filter(Employee.is_deleted == False)
    if not q or len(q) < 1:
        rows = base.limit(20).all()
    else:
        term = f"%{q}%"
        rows = base.filter(
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
    row = db.query(Employee).filter(Employee.id == employee_id, Employee.is_deleted == False).first()
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
    row = db.query(Employee).filter(Employee.id == employee_id, Employee.is_deleted == False).first()
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
    row = db.query(Employee).filter(Employee.id == employee_id, Employee.is_deleted == False).first()
    if not row:
        raise HTTPException(status_code=404, detail="Employee not found")
    acct_count = db.query(UserAccount).filter(UserAccount.employee_id == employee_id, UserAccount.is_deleted == False).count()
    if acct_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete this employee because they have a linked user account. Remove the user account first.",
        )
    row.is_deleted = True
    db.commit()


@router.post("/{employee_id}/photo", response_model=EmployeeOut)
def upload_photo(employee_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    row = db.query(Employee).filter(Employee.id == employee_id, Employee.is_deleted == False).first()
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


# --------------- Org Chart PDF Export ---------------

_ORG_NODE_W = 180
_ORG_NODE_H = 52
_ORG_H_GAP = 40
_ORG_V_GAP = 70
_ORG_MAX_ROW = 4
_ORG_CELL_W = _ORG_NODE_W + _ORG_H_GAP
_ORG_PADDING = 40


def _extract_email(supervisor: str) -> str:
    if not supervisor:
        return ""
    m = re.search(r"\(([^)]+@[^)]+)\)", supervisor)
    if m:
        return m.group(1).strip().lower()
    return supervisor.strip().lower()


def _chunk(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i : i + n]


def _build_org_tree(employees):
    active = [e for e in employees if e.status == "Active"]
    email_map: dict[str, object] = {}
    for e in active:
        if e.email:
            email_map[e.email.lower()] = e

    children_by_parent: dict[int, list[int]] = {}
    has_parent: set[int] = set()

    for e in active:
        if e.supervisor:
            sup_email = _extract_email(e.supervisor)
            sup = email_map.get(sup_email)
            if sup:
                children_by_parent.setdefault(sup.id, []).append(e.id)
                has_parent.add(e.id)

    connected = has_parent | set(children_by_parent.keys())
    people = {e.id: e for e in active if e.id in connected}
    root_ids = [eid for eid in people if eid not in has_parent and eid in children_by_parent]

    return people, children_by_parent, root_ids


def _sort_children(ids, children_by_parent):
    leaves = [c for c in ids if not children_by_parent.get(c)]
    branches = [c for c in ids if children_by_parent.get(c)]
    return leaves + branches


def _get_span(nid, children_by_parent, cache):
    if nid in cache:
        return cache[nid]
    kids = children_by_parent.get(nid, [])
    if not kids:
        cache[nid] = 1
        return 1
    sorted_kids = _sort_children(kids, children_by_parent)
    rows = list(_chunk(sorted_kids, _ORG_MAX_ROW))
    max_row_span = 0
    for row in rows:
        rs = sum(_get_span(c, children_by_parent, cache) for c in row)
        if rs > max_row_span:
            max_row_span = rs
    span = max(1, max_row_span)
    cache[nid] = span
    return span


def _get_subtree_h(nid, children_by_parent, cache):
    if nid in cache:
        return cache[nid]
    kids = children_by_parent.get(nid, [])
    if not kids:
        cache[nid] = 0
        return 0
    sorted_kids = _sort_children(kids, children_by_parent)
    rows = list(_chunk(sorted_kids, _ORG_MAX_ROW))
    total = 0
    for row in rows:
        mx = max((_get_subtree_h(c, children_by_parent, cache) for c in row), default=0)
        total += (_ORG_NODE_H + _ORG_V_GAP) + mx
    cache[nid] = total
    return total


def _layout_positions(root_ids, children_by_parent):
    span_cache: dict[int, int] = {}
    h_cache: dict[int, int] = {}
    positions: dict[int, tuple[float, float]] = {}

    def place(nid, left_span, y):
        span = _get_span(nid, children_by_parent, span_cache)
        cx = _ORG_PADDING + (left_span + span / 2) * _ORG_CELL_W - _ORG_NODE_W / 2
        positions[nid] = (cx, y)

        kids = children_by_parent.get(nid, [])
        if not kids:
            return
        sorted_kids = _sort_children(kids, children_by_parent)
        rows = list(_chunk(sorted_kids, _ORG_MAX_ROW))
        cur_y = y + _ORG_NODE_H + _ORG_V_GAP

        for row in rows:
            row_span = sum(_get_span(c, children_by_parent, span_cache) for c in row)
            child_left = left_span + (span - row_span) / 2
            mx_h = max((_get_subtree_h(c, children_by_parent, h_cache) for c in row), default=0)
            for c in row:
                place(c, child_left, cur_y)
                child_left += _get_span(c, children_by_parent, span_cache)
            cur_y += (_ORG_NODE_H + _ORG_V_GAP) + mx_h

    cur_left = 0
    for rid in root_ids:
        place(rid, cur_left, _ORG_PADDING)
        cur_left += _get_span(rid, children_by_parent, span_cache) + 1

    return positions


def _sanitize_text(text: str) -> str:
    replacements = {
        "\u2013": "-", "\u2014": "-", "\u2018": "'", "\u2019": "'",
        "\u201c": '"', "\u201d": '"', "\u2026": "...", "\u00a0": " ",
    }
    for char, repl in replacements.items():
        text = text.replace(char, repl)
    return text.encode("latin-1", errors="replace").decode("latin-1")


def _display_name(emp):
    if emp.display_name:
        return _sanitize_text(emp.display_name)
    parts = [emp.first_name or "", emp.last_name or ""]
    return _sanitize_text(" ".join(p for p in parts if p).strip() or "-")


@router.get("/org-chart/export")
def export_org_chart_pdf(db: Session = Depends(get_db)):
    from fpdf import FPDF

    employees = db.query(Employee).filter(Employee.is_deleted == False).all()
    people, children_by_parent, root_ids = _build_org_tree(employees)

    if not people:
        raise HTTPException(status_code=404, detail="No connected employees found")

    positions = _layout_positions(root_ids, children_by_parent)

    max_x = max(x + _ORG_NODE_W for x, _ in positions.values()) + _ORG_PADDING
    max_y = max(y + _ORG_NODE_H for _, y in positions.values()) + _ORG_PADDING

    pdf = FPDF(orientation="L" if max_x > max_y else "P", unit="pt", format=(max_x, max_y))
    pdf.set_auto_page_break(auto=False)
    pdf.add_page()
    pdf.set_fill_color(255, 255, 255)
    pdf.rect(0, 0, max_x, max_y, "F")

    edges: list[tuple[int, int]] = []
    for parent_id, kids in children_by_parent.items():
        if parent_id not in positions:
            continue
        for kid_id in kids:
            if kid_id in positions:
                edges.append((parent_id, kid_id))

    pdf.set_draw_color(180, 190, 200)
    pdf.set_line_width(1.2)
    for parent_id, kid_id in edges:
        px, py = positions[parent_id]
        cx, cy = positions[kid_id]
        p_bottom_x = px + _ORG_NODE_W / 2
        p_bottom_y = py + _ORG_NODE_H
        c_top_x = cx + _ORG_NODE_W / 2
        c_top_y = cy
        mid_y = (p_bottom_y + c_top_y) / 2
        pdf.line(p_bottom_x, p_bottom_y, p_bottom_x, mid_y)
        pdf.line(p_bottom_x, mid_y, c_top_x, mid_y)
        pdf.line(c_top_x, mid_y, c_top_x, c_top_y)

    for nid, (x, y) in positions.items():
        emp = people.get(nid)
        if not emp:
            continue

        is_root = nid in root_ids
        if is_root:
            pdf.set_fill_color(0, 166, 227)
            pdf.set_text_color(255, 255, 255)
        else:
            pdf.set_fill_color(245, 248, 252)
            pdf.set_text_color(30, 41, 59)

        pdf.set_draw_color(200, 210, 220)
        pdf.set_line_width(0.5)
        pdf.rect(x, y, _ORG_NODE_W, _ORG_NODE_H, "FD")

        name = _display_name(emp)
        role = _sanitize_text(emp.job_title or emp.department or "")

        pdf.set_font("Helvetica", "B", 9)
        pdf.set_xy(x + 4, y + 8)
        pdf.cell(_ORG_NODE_W - 8, 12, name[:28], align="C")

        if is_root:
            pdf.set_text_color(220, 240, 255)
        else:
            pdf.set_text_color(100, 116, 139)
        pdf.set_font("Helvetica", "", 7)
        pdf.set_xy(x + 4, y + 22)
        pdf.cell(_ORG_NODE_W - 8, 10, role[:34], align="C")

        pdf.set_text_color(0, 0, 0)

    buf = io.BytesIO()
    pdf.output(buf)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=organization-chart.pdf"},
    )
