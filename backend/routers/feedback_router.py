from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
import models
from auth import require_student, require_permission

router = APIRouter(prefix="/feedback", tags=["feedback"])


class FeedbackCreate(BaseModel):
    paper_id: Optional[int] = None
    test_id: Optional[int] = None
    rating: Optional[int] = None  # 1-5
    comment: Optional[str] = None


class FeedbackOut(BaseModel):
    id: int
    student_id: int
    paper_id: Optional[int]
    test_id: Optional[int]
    rating: Optional[int]
    comment: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True


@router.post("", response_model=FeedbackOut)
def submit_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    if payload.rating and (payload.rating < 1 or payload.rating > 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    fb = models.Feedback(
        student_id=current_user.id,
        paper_id=payload.paper_id,
        test_id=payload.test_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb


@router.get("/admin", response_model=List[FeedbackOut])
def list_feedback(
    paper_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_results")),
):
    q = db.query(models.Feedback)
    if paper_id:
        q = q.filter(models.Feedback.paper_id == paper_id)
    return q.order_by(models.Feedback.created_at.desc()).all()
