from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
import models
from auth import require_permission, log_audit

router = APIRouter(prefix="/batches", tags=["batches"])


class BatchCreate(BaseModel):
    name: str
    course_id: Optional[int] = None
    college_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class BatchUpdate(BaseModel):
    name: Optional[str] = None
    course_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class BatchOut(BaseModel):
    id: int
    name: str
    course_id: Optional[int]
    college_id: Optional[int]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    is_active: bool
    created_at: datetime
    member_count: Optional[int] = 0
    class Config:
        from_attributes = True


class AssignStudentRequest(BaseModel):
    student_ids: List[int]


@router.get("", response_model=List[BatchOut])
def list_batches(
    college_id: Optional[int] = None,
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_batches")),
):
    q = db.query(models.Batch).filter(models.Batch.is_active == True)
    if college_id:
        q = q.filter(models.Batch.college_id == college_id)
    if course_id:
        q = q.filter(models.Batch.course_id == course_id)
    batches = q.all()
    result = []
    for b in batches:
        count = db.query(models.BatchMember).filter(models.BatchMember.batch_id == b.id).count()
        out = BatchOut.model_validate(b)
        out.member_count = count
        result.append(out)
    return result


@router.post("", response_model=BatchOut)
def create_batch(
    payload: BatchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_batches")),
):
    batch = models.Batch(**payload.model_dump())
    db.add(batch)
    db.flush()
    log_audit(db, current_user, "CREATE_BATCH", "Batch", batch.id, f"Created batch {batch.name}")
    db.commit()
    db.refresh(batch)
    out = BatchOut.model_validate(batch)
    out.member_count = 0
    return out


@router.patch("/{batch_id}", response_model=BatchOut)
def update_batch(
    batch_id: int,
    payload: BatchUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_batches")),
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(batch, k, v)
    log_audit(db, current_user, "UPDATE_BATCH", "Batch", batch_id)
    db.commit()
    db.refresh(batch)
    count = db.query(models.BatchMember).filter(models.BatchMember.batch_id == batch_id).count()
    out = BatchOut.model_validate(batch)
    out.member_count = count
    return out


@router.delete("/{batch_id}")
def delete_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_batches")),
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch.is_active = False
    log_audit(db, current_user, "DELETE_BATCH", "Batch", batch_id)
    db.commit()
    return {"detail": "Batch archived"}


@router.post("/{batch_id}/assign-students")
def assign_students(
    batch_id: int,
    payload: AssignStudentRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_batches")),
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    added = 0
    skipped = 0
    for sid in payload.student_ids:
        existing = db.query(models.BatchMember).filter(
            models.BatchMember.batch_id == batch_id,
            models.BatchMember.student_id == sid,
        ).first()
        if existing:
            skipped += 1
            continue
        db.add(models.BatchMember(batch_id=batch_id, student_id=sid))
        added += 1
    log_audit(db, current_user, "ASSIGN_BATCH_STUDENTS", "Batch", batch_id, f"Added {added} students")
    db.commit()
    return {"added": added, "skipped": skipped}


@router.get("/{batch_id}/students")
def batch_students(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_batches")),
):
    members = db.query(models.BatchMember).filter(models.BatchMember.batch_id == batch_id).all()
    result = []
    for m in members:
        s = m.student
        result.append({
            "id": s.id,
            "email": s.email,
            "roll_number": s.roll_number,
            "full_name": s.full_name,
        })
    return result


@router.delete("/{batch_id}/students/{student_id}")
def remove_student_from_batch(
    batch_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_batches")),
):
    member = db.query(models.BatchMember).filter(
        models.BatchMember.batch_id == batch_id,
        models.BatchMember.student_id == student_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Student not in batch")
    db.delete(member)
    db.commit()
    return {"detail": "Student removed from batch"}
