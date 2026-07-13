from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
import models
from auth import require_permission

router = APIRouter(prefix="/audit", tags=["audit"])


class AuditLogOut(BaseModel):
    id: int
    actor_id: Optional[int]
    actor_email: Optional[str]
    action: str
    entity_type: Optional[str]
    entity_id: Optional[str]
    detail: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True


@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    actor_id: Optional[int] = None,
    actor_email: Optional[str] = None,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_audit_log")),
):
    q = db.query(models.AuditLog)
    if action:
        q = q.filter(models.AuditLog.action.ilike(f"%{action}%"))
    if entity_type:
        q = q.filter(models.AuditLog.entity_type == entity_type)
    if actor_id:
        q = q.filter(models.AuditLog.actor_id == actor_id)
    if actor_email:
        q = q.filter(models.AuditLog.actor_email.ilike(f"%{actor_email}%"))
    return q.order_by(models.AuditLog.created_at.desc()).limit(limit).all()
