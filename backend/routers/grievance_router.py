import random
import string
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
import models
from auth import require_student, require_permission, get_current_user, log_audit

router = APIRouter(prefix="/grievances", tags=["grievances"])


def generate_tracking_id() -> str:
    return "GRV-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


class GrievanceCreate(BaseModel):
    subject: str
    description: str


class GrievanceResolve(BaseModel):
    status: str  # in_progress | resolved
    admin_note: Optional[str] = None


class GrievanceOut(BaseModel):
    id: int
    tracking_id: str
    student_id: int
    subject: str
    description: str
    status: str
    admin_note: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]
    class Config:
        from_attributes = True


# ── Student: raise grievance ───────────────────────────────────────────────────

@router.post("", response_model=GrievanceOut)
def raise_grievance(
    payload: GrievanceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    tracking_id = generate_tracking_id()
    while db.query(models.Grievance).filter(models.Grievance.tracking_id == tracking_id).first():
        tracking_id = generate_tracking_id()

    g = models.Grievance(
        tracking_id=tracking_id,
        student_id=current_user.id,
        subject=payload.subject,
        description=payload.description,
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return g


@router.get("/my", response_model=List[GrievanceOut])
def my_grievances(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    return db.query(models.Grievance).filter(
        models.Grievance.student_id == current_user.id
    ).order_by(models.Grievance.created_at.desc()).all()


# ── Admin: manage grievances ───────────────────────────────────────────────────

@router.get("/admin", response_model=List[GrievanceOut])
def list_grievances(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_grievances")),
):
    q = db.query(models.Grievance)
    if status:
        q = q.filter(models.Grievance.status == status)
    return q.order_by(models.Grievance.created_at.desc()).all()


@router.patch("/admin/{grievance_id}", response_model=GrievanceOut)
def update_grievance(
    grievance_id: int,
    payload: GrievanceResolve,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_grievances")),
):
    g = db.query(models.Grievance).filter(models.Grievance.id == grievance_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Grievance not found")
    g.status = payload.status
    if payload.admin_note:
        g.admin_note = payload.admin_note
    if payload.status == "resolved":
        g.resolved_at = datetime.utcnow()
    log_audit(db, current_user, "UPDATE_GRIEVANCE", "Grievance", grievance_id, f"Status: {payload.status}")
    db.commit()
    db.refresh(g)
    return g
