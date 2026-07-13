from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
import models
from auth import require_permission, require_student, get_current_user, log_audit

router = APIRouter(prefix="/tests", tags=["tests"])


def _test_out(test: "models.Test") -> TestOut:
    """Resolve inherited properties into a serialisable dict."""
    return TestOut(
        id=test.id,
        name=test.name,
        code=test.code,
        paper_id=test.paper_id,
        course_id=test.course_id,
        scheduled_date=test.scheduled_date,
        start_time=test.start_time,
        end_time=test.end_time,
        duration_minutes=test.duration_minutes,
        total_questions=test.total_questions,
        max_attempts=test.max_attempts or 1,
        random_questions=test.random_questions or False,
        random_options=test.random_options or False,
        negative_marks=test.negative_marks,
        pass_percentage=test.pass_percentage,
        approval_status=test.approval_status or "approved",
        status=test.status,
        created_at=test.created_at,
    )


class TestCreate(BaseModel):
    name: str
    code: Optional[str] = None
    paper_id: int
    course_id: Optional[int] = None
    scheduled_date: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    total_questions: Optional[int] = None
    max_attempts: int = 1
    random_questions: bool = False
    random_options: bool = False
    duration_minutes: Optional[int] = None
    negative_marks: Optional[float] = None
    pass_percentage: Optional[float] = None


class TestUpdate(BaseModel):
    name: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    total_questions: Optional[int] = None
    max_attempts: Optional[int] = None
    random_questions: Optional[bool] = None
    random_options: Optional[bool] = None
    duration_minutes: Optional[int] = None
    negative_marks: Optional[float] = None
    pass_percentage: Optional[float] = None
    status: Optional[str] = None


class TestOut(BaseModel):
    id: int
    name: str
    code: Optional[str]
    paper_id: int
    course_id: Optional[int]
    scheduled_date: Optional[datetime]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    duration_minutes: int
    total_questions: Optional[int]
    max_attempts: int
    random_questions: bool
    random_options: bool
    negative_marks: float
    pass_percentage: float
    approval_status: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AssignTestRequest(BaseModel):
    student_ids: Optional[List[int]] = None
    batch_ids: Optional[List[int]] = None
    group_ids: Optional[List[int]] = None


# ── Admin: CRUD ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[TestOut])
def list_tests(
    status: Optional[str] = None,
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_tests")),
):
    q = db.query(models.Test).filter(models.Test.is_deleted == False)
    if status:
        q = q.filter(models.Test.status == status)
    if course_id:
        q = q.filter(models.Test.course_id == course_id)
    tests = q.order_by(models.Test.created_at.desc()).all()
    return [_test_out(t) for t in tests]


@router.post("", response_model=TestOut)
def create_test(
    payload: TestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_tests")),
):
    paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == payload.paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    test = models.Test(
        name=payload.name,
        code=payload.code,
        paper_id=payload.paper_id,
        course_id=payload.course_id,
        scheduled_date=payload.scheduled_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        total_questions=payload.total_questions,
        max_attempts=payload.max_attempts,
        random_questions=payload.random_questions,
        random_options=payload.random_options,
        duration_minutes_override=payload.duration_minutes,
        negative_marks_override=payload.negative_marks,
        pass_percentage_override=payload.pass_percentage,
        approval_status="approved" if current_user.role in models.FULL_ACCESS_ROLES else "pending",
    )
    db.add(test)
    db.flush()
    log_audit(db, current_user, "CREATE_TEST", "Test", test.id, f"Created test {test.name}")
    db.commit()
    db.refresh(test)
    return _test_out(test)


@router.patch("/{test_id}", response_model=TestOut)
def update_test(
    test_id: int,
    payload: TestUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_tests")),
):
    test = db.query(models.Test).filter(models.Test.id == test_id, models.Test.is_deleted == False).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    if test.status == models.TestStatus.live:
        raise HTTPException(status_code=400, detail="Cannot edit a live test")

    if payload.name is not None:
        test.name = payload.name
    if payload.scheduled_date is not None:
        test.scheduled_date = payload.scheduled_date
    if payload.start_time is not None:
        test.start_time = payload.start_time
    if payload.end_time is not None:
        test.end_time = payload.end_time
    if payload.total_questions is not None:
        test.total_questions = payload.total_questions
    if payload.max_attempts is not None:
        test.max_attempts = payload.max_attempts
    if payload.random_questions is not None:
        test.random_questions = payload.random_questions
    if payload.random_options is not None:
        test.random_options = payload.random_options
    if payload.duration_minutes is not None:
        test.duration_minutes_override = payload.duration_minutes
    if payload.negative_marks is not None:
        test.negative_marks_override = payload.negative_marks
    if payload.pass_percentage is not None:
        test.pass_percentage_override = payload.pass_percentage
    if payload.status is not None:
        test.status = payload.status

    log_audit(db, current_user, "UPDATE_TEST", "Test", test_id)
    db.commit()
    db.refresh(test)
    return _test_out(test)


@router.delete("/{test_id}")
def delete_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_tests")),
):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    if test.status == models.TestStatus.live:
        raise HTTPException(status_code=400, detail="Cannot delete a live test")
    test.is_deleted = True
    log_audit(db, current_user, "DELETE_TEST", "Test", test_id)
    db.commit()
    return {"detail": "Test archived"}


@router.post("/{test_id}/approve")
def approve_test(
    test_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_tests")),
):
    """Approve or reject a test. Only full-access roles can approve."""
    if current_user.role not in models.FULL_ACCESS_ROLES:
        raise HTTPException(status_code=403, detail="Only admins can approve tests")
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    status = payload.get("status")
    if status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be approved or rejected")
    test.approval_status = status
    test.approval_note = payload.get("note")
    log_audit(db, current_user, f"TEST_{status.upper()}", "Test", test_id, payload.get("note"))
    db.commit()
    return {"detail": f"Test {status}", "id": test_id}


@router.get("/pending-approval")
def list_pending_tests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_tests")),
):
    tests = db.query(models.Test).filter(
        models.Test.approval_status == "pending",
        models.Test.is_deleted == False,
    ).all()
    return [_test_out(t) for t in tests]


@router.post("/{test_id}/assign")
def assign_test(
    test_id: int,
    payload: AssignTestRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_tests")),
):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    added = 0
    for sid in (payload.student_ids or []):
        existing = db.query(models.TestAssignment).filter(
            models.TestAssignment.test_id == test_id,
            models.TestAssignment.student_id == sid,
        ).first()
        if not existing:
            db.add(models.TestAssignment(test_id=test_id, student_id=sid))
            added += 1

    for bid in (payload.batch_ids or []):
        existing = db.query(models.TestAssignment).filter(
            models.TestAssignment.test_id == test_id,
            models.TestAssignment.batch_id == bid,
        ).first()
        if not existing:
            db.add(models.TestAssignment(test_id=test_id, batch_id=bid))
            added += 1

    for gid in (payload.group_ids or []):
        existing = db.query(models.TestAssignment).filter(
            models.TestAssignment.test_id == test_id,
            models.TestAssignment.group_id == gid,
        ).first()
        if not existing:
            db.add(models.TestAssignment(test_id=test_id, group_id=gid))
            added += 1

    log_audit(db, current_user, "ASSIGN_TEST", "Test", test_id, f"Assigned to {added} entities")
    db.commit()
    return {"assigned": added}


@router.get("/{test_id}/report")
def test_report(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_results")),
):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    submissions = db.query(models.Submission).filter(models.Submission.test_id == test_id).all()
    if not submissions:
        return {"test_id": test_id, "total_submissions": 0, "message": "No submissions yet"}

    scores = [s.score for s in submissions if s.score is not None]
    passed = [s for s in submissions if s.passed]

    return {
        "test_id": test_id,
        "test_name": test.name,
        "total_submissions": len(submissions),
        "passed": len(passed),
        "failed": len(submissions) - len(passed),
        "pass_rate": round(len(passed) / len(submissions) * 100, 1) if submissions else 0,
        "average_score": round(sum(scores) / len(scores), 2) if scores else 0,
        "highest_score": max(scores) if scores else 0,
        "lowest_score": min(scores) if scores else 0,
    }


# ── Student: get assigned tests ────────────────────────────────────────────────

@router.get("/my-tests")
def my_tests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    """Get all tests assigned to the current student (direct + batch + group)."""
    test_ids = set()

    # Direct assignments
    direct = db.query(models.TestAssignment).filter(
        models.TestAssignment.student_id == current_user.id
    ).all()
    for a in direct:
        test_ids.add(a.test_id)

    # Via batch
    batch_memberships = db.query(models.BatchMember).filter(
        models.BatchMember.student_id == current_user.id
    ).all()
    for bm in batch_memberships:
        batch_assignments = db.query(models.TestAssignment).filter(
            models.TestAssignment.batch_id == bm.batch_id
        ).all()
        for a in batch_assignments:
            test_ids.add(a.test_id)

    # Via group
    group_memberships = db.query(models.GroupMember).filter(
        models.GroupMember.student_id == current_user.id
    ).all()
    for gm in group_memberships:
        group_assignments = db.query(models.TestAssignment).filter(
            models.TestAssignment.group_id == gm.group_id
        ).all()
        for a in group_assignments:
            test_ids.add(a.test_id)

    tests = db.query(models.Test).filter(
        models.Test.id.in_(test_ids),
        models.Test.is_deleted == False,
    ).all()

    result = []
    for t in tests:
        submitted = db.query(models.Submission).filter(
            models.Submission.student_id == current_user.id,
            models.Submission.test_id == t.id,
        ).first()
        result.append({
            "id": t.id,
            "name": t.name,
            "paper_id": t.paper_id,
            "scheduled_date": t.scheduled_date,
            "start_time": t.start_time,
            "end_time": t.end_time,
            "duration_minutes": t.duration_minutes,
            "status": t.status,
            "submitted": submitted is not None,
            "score": submitted.score if submitted else None,
            "passed": submitted.passed if submitted else None,
        })
    return result
