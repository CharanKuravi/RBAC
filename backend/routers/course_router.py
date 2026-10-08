from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
import models
from auth import require_permission, get_current_user, log_audit

router = APIRouter(prefix="/courses", tags=["courses"])


class CourseCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    college_id: Optional[int] = None


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CourseOut(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str]
    college_id: Optional[int]
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True


@router.get("", response_model=List[CourseOut])
def list_courses(
    college_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_courses")),
):
    q = db.query(models.Course).filter(models.Course.is_active == True)
    if college_id:
        q = q.filter(models.Course.college_id == college_id)
    return q.all()


@router.post("", response_model=CourseOut)
def create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_courses")),
):
    course = models.Course(**payload.model_dump())
    db.add(course)
    db.flush()
    log_audit(db, current_user, "CREATE_COURSE", "Course", course.id, f"Created course {course.name}")
    db.commit()
    db.refresh(course)
    return course


@router.patch("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int,
    payload: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_courses")),
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(course, k, v)
    log_audit(db, current_user, "UPDATE_COURSE", "Course", course_id)
    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_courses")),
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    course.is_active = False  # soft delete
    log_audit(db, current_user, "DELETE_COURSE", "Course", course_id)
    db.commit()
    return {"detail": "Course archived"}
