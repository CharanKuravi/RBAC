from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
import models
from auth import require_permission, log_audit

router = APIRouter(prefix="/groups", tags=["groups"])


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    college_id: Optional[int] = None
    batch_id: Optional[int] = None


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    batch_id: Optional[int] = None
    is_active: Optional[bool] = None


class GroupOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    college_id: Optional[int]
    batch_id: Optional[int]
    is_active: bool
    created_at: datetime
    member_count: Optional[int] = 0
    class Config:
        from_attributes = True


class AssignRequest(BaseModel):
    student_ids: List[int]


@router.get("", response_model=List[GroupOut])
def list_groups(
    college_id: Optional[int] = None,
    batch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_groups")),
):
    q = db.query(models.Group).filter(models.Group.is_active == True)
    if college_id:
        q = q.filter(models.Group.college_id == college_id)
    if batch_id:
        q = q.filter(models.Group.batch_id == batch_id)
    groups = q.all()
    result = []
    for g in groups:
        count = db.query(models.GroupMember).filter(models.GroupMember.group_id == g.id).count()
        out = GroupOut.model_validate(g)
        out.member_count = count
        result.append(out)
    return result


@router.post("", response_model=GroupOut)
def create_group(
    payload: GroupCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_groups")),
):
    group = models.Group(**payload.model_dump())
    db.add(group)
    db.flush()
    log_audit(db, current_user, "CREATE_GROUP", "Group", group.id, f"Created group {group.name}")
    db.commit()
    db.refresh(group)
    out = GroupOut.model_validate(group)
    out.member_count = 0
    return out


@router.patch("/{group_id}", response_model=GroupOut)
def update_group(
    group_id: int,
    payload: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_groups")),
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(group, k, v)
    log_audit(db, current_user, "UPDATE_GROUP", "Group", group_id)
    db.commit()
    db.refresh(group)
    count = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id).count()
    out = GroupOut.model_validate(group)
    out.member_count = count
    return out


@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_groups")),
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group.is_active = False
    log_audit(db, current_user, "DELETE_GROUP", "Group", group_id)
    db.commit()
    return {"detail": "Group archived"}


@router.post("/{group_id}/assign-students")
def assign_students(
    group_id: int,
    payload: AssignRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_groups")),
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    added = 0
    for sid in payload.student_ids:
        existing = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.student_id == sid,
        ).first()
        if not existing:
            db.add(models.GroupMember(group_id=group_id, student_id=sid))
            added += 1
    db.commit()
    return {"added": added}
