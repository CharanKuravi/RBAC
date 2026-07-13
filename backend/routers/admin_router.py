from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
import models
import schemas
from auth import require_permission, hash_password, generate_roll_number

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Users / Candidates ─────────────────────────────────────────────────────────

@router.get("/users", response_model=List[schemas.UserOut])
def list_users(
    role: Optional[str] = None,
    is_approved: Optional[bool] = None,
    is_deleted: Optional[bool] = False,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_students")),
):
    q = db.query(models.User).filter(models.User.is_deleted == is_deleted)
    if role:
        q = q.filter(models.User.role == role)
    if is_approved is not None:
        q = q.filter(models.User.is_approved == is_approved)
    return q.all()


@router.post("/users", response_model=schemas.UserOut)
def create_user(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_students")),
):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    roll = None
    if payload.role == schemas.UserRole.student:
        roll = generate_roll_number(db)

    # Non-student roles are auto-approved
    auto_approved = payload.role != schemas.UserRole.student

    user = models.User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        roll_number=roll,
        full_name=payload.full_name,
        course_id=payload.course_id,
        is_approved=auto_approved,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_students")),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.email is not None:
        user.email = payload.email
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.course_id is not None:
        user.course_id = payload.course_id
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/approve")
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_students")),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_approved = True
    user.is_active = True
    db.commit()
    return {"detail": "Candidate approved", "cid": user.roll_number}


@router.post("/users/{user_id}/reject")
def reject_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_students")),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_approved = False
    user.is_active = False
    db.commit()
    return {"detail": "Candidate rejected"}


@router.post("/users/bulk-approve")
def bulk_approve(
    payload: schemas.BulkActionRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_students")),
):
    users = db.query(models.User).filter(models.User.id.in_(payload.user_ids)).all()
    for u in users:
        u.is_approved = True
        u.is_active = True
    db.commit()
    return {"detail": f"{len(users)} candidates approved"}


@router.post("/users/bulk-reject")
def bulk_reject(
    payload: schemas.BulkActionRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_students")),
):
    users = db.query(models.User).filter(models.User.id.in_(payload.user_ids)).all()
    for u in users:
        u.is_approved = False
        u.is_active = False
    db.commit()
    return {"detail": f"{len(users)} candidates rejected"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_students")),
):
    """Soft delete — moves to trash."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_deleted = True
    user.is_active = False
    db.commit()
    return {"detail": "Moved to trash"}


@router.post("/users/{user_id}/restore")
def restore_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_students")),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_deleted = False
    db.commit()
    return {"detail": "Restored from trash"}


@router.delete("/users/{user_id}/permanent")
def permanent_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_students")),
):
    """Permanent delete — only from trash."""
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.is_deleted == True,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not in trash")
    db.delete(user)
    db.commit()
    return {"detail": "Permanently deleted"}


# ── Question Papers ────────────────────────────────────────────────────────────

@router.get("/papers", response_model=List[schemas.QuestionPaperOut])
def list_papers(
    is_deleted: Optional[bool] = False,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_papers")),
):
    return db.query(models.QuestionPaper).filter(
        models.QuestionPaper.is_deleted == is_deleted
    ).all()


@router.post("/papers", response_model=schemas.QuestionPaperOut)
def create_paper(
    payload: schemas.QuestionPaperCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_papers")),
):
    paper = models.QuestionPaper(**payload.model_dump())
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper


@router.patch("/papers/{paper_id}", response_model=schemas.QuestionPaperOut)
def update_paper(
    paper_id: int,
    payload: schemas.QuestionPaperUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_papers")),
):
    paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(paper, field, value)
    db.commit()
    db.refresh(paper)
    return paper


@router.delete("/papers/{paper_id}")
def delete_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_papers")),
):
    """Soft delete — moves to trash."""
    paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    paper.is_deleted = True
    paper.is_active = False
    db.commit()
    return {"detail": "Moved to trash"}


@router.post("/papers/{paper_id}/restore")
def restore_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_papers")),
):
    paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    paper.is_deleted = False
    paper.is_active = True
    db.commit()
    return {"detail": "Restored"}


@router.delete("/papers/{paper_id}/permanent")
def permanent_delete_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_papers")),
):
    paper = db.query(models.QuestionPaper).filter(
        models.QuestionPaper.id == paper_id,
        models.QuestionPaper.is_deleted == True,
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not in trash")
    db.delete(paper)
    db.commit()
    return {"detail": "Permanently deleted"}


# ── Questions (bank-backed) ────────────────────────────────────────────────────

@router.get("/papers/{paper_id}/questions", response_model=List[schemas.QuestionOut])
def list_questions(
    paper_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_papers")),
):
    questions = db.query(models.Question).filter(
        models.Question.paper_id == paper_id
    ).order_by(models.Question.order_index).all()
    return [schemas.QuestionOut.from_question(q) for q in questions]


@router.post("/papers/{paper_id}/questions", response_model=schemas.QuestionOut)
def add_question(
    paper_id: int,
    payload: schemas.QuestionCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_papers")),
):
    paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    if payload.bank_id:
        bank_entry = db.query(models.QuestionBank).filter(
            models.QuestionBank.id == payload.bank_id,
            models.QuestionBank.is_active == True,
        ).first()
        if not bank_entry:
            raise HTTPException(status_code=404, detail="Question bank entry not found")
    else:
        if not all([payload.question_text, payload.option_a, payload.option_b,
                    payload.option_c, payload.option_d, payload.correct_option]):
            raise HTTPException(status_code=400, detail="Provide bank_id or full question content")
        if payload.correct_option.upper() not in ("A", "B", "C", "D"):
            raise HTTPException(status_code=400, detail="correct_option must be A, B, C, or D")
        bank_entry = models.QuestionBank(
            question_text=payload.question_text,
            option_a=payload.option_a,
            option_b=payload.option_b,
            option_c=payload.option_c,
            option_d=payload.option_d,
            correct_option=payload.correct_option.upper(),
            marks=payload.marks,
        )
        db.add(bank_entry)
        db.flush()

    question = models.Question(
        paper_id=paper_id,
        bank_id=bank_entry.id,
        order_index=payload.order_index,
        marks_override=payload.marks if payload.marks != bank_entry.marks else None,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return schemas.QuestionOut.from_question(question)


@router.patch("/questions/{question_id}", response_model=schemas.QuestionOut)
def update_question(
    question_id: int,
    payload: schemas.QuestionUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_papers")),
):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if payload.order_index is not None:
        question.order_index = payload.order_index
    if payload.marks is not None:
        question.marks_override = payload.marks
    db.commit()
    db.refresh(question)
    return schemas.QuestionOut.from_question(question)


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_papers")),
):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(question)
    db.commit()
    return {"detail": "Question removed from paper"}


# ── Assignments ────────────────────────────────────────────────────────────────

@router.post("/assign-batch")
def assign_paper_to_batch(
    payload: dict,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_assignments")),
):
    """Assign a paper to all students in a batch at once."""
    batch_id = payload.get("batch_id")
    paper_id = payload.get("paper_id")
    if not batch_id or not paper_id:
        raise HTTPException(status_code=400, detail="batch_id and paper_id are required")

    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    members = db.query(models.BatchMember).filter(models.BatchMember.batch_id == batch_id).all()
    assigned = 0
    skipped = 0
    for m in members:
        existing = db.query(models.PaperAssignment).filter(
            models.PaperAssignment.student_id == m.student_id,
            models.PaperAssignment.paper_id == paper_id,
        ).first()
        if existing:
            skipped += 1
            continue
        db.add(models.PaperAssignment(student_id=m.student_id, paper_id=paper_id))
        assigned += 1
    db.commit()
    return {"assigned": assigned, "skipped": skipped, "message": f"Paper assigned to {assigned} students in batch, {skipped} already had it."}


@router.post("/assign", response_model=schemas.AssignmentOut)
def assign_paper(
    payload: schemas.AssignPaperRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_assignments")),
):
    student = db.query(models.User).filter(
        models.User.id == payload.student_id,
        models.User.role == models.UserRole.student,
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == payload.paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    existing = db.query(models.PaperAssignment).filter(
        models.PaperAssignment.student_id == payload.student_id,
        models.PaperAssignment.paper_id == payload.paper_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Paper already assigned to this student")

    assignment = models.PaperAssignment(**payload.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/assignments", response_model=List[schemas.AssignmentOut])
def list_assignments(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_assignments")),
):
    return db.query(models.PaperAssignment).all()


# ── Submissions & Malpractice ──────────────────────────────────────────────────

@router.get("/submissions", response_model=List[schemas.SubmissionOut])
def list_submissions(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("view_submissions")),
):
    return db.query(models.Submission).all()


@router.get("/malpractice", response_model=List[schemas.MalpracticeLogOut])
def list_malpractice(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("view_malpractice")),
):
    return db.query(models.MalpracticeLog).order_by(models.MalpracticeLog.logged_at.desc()).all()


@router.get("/malpractice/{student_id}", response_model=List[schemas.MalpracticeLogOut])
def student_malpractice(
    student_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("view_malpractice")),
):
    return db.query(models.MalpracticeLog).filter(
        models.MalpracticeLog.student_id == student_id
    ).order_by(models.MalpracticeLog.logged_at.desc()).all()


@router.delete("/submissions/{submission_id}/reset")
def reset_exam_access(
    submission_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_assignments")),
):
    submission = db.query(models.Submission).filter(models.Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    db.query(models.Answer).filter(models.Answer.submission_id == submission_id).delete()
    db.delete(submission)
    db.commit()
    return {"detail": "Exam access re-granted"}


@router.get("/students/{student_id}/submissions")
def student_submissions(
    student_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("view_submissions")),
):
    subs = db.query(models.Submission).filter(models.Submission.student_id == student_id).all()
    return [
        {
            "id": s.id,
            "paper_id": s.paper_id,
            "paper_title": s.paper.title if s.paper else "--",
            "score": s.score,
            "total_marks": s.total_marks,
            "submitted_at": s.submitted_at,
        }
        for s in subs
    ]


# ── Reports ────────────────────────────────────────────────────────────────────

@router.get("/reports/candidates")
def report_candidates(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("view_results")),
):
    total = db.query(models.User).filter(models.User.role == models.UserRole.student, models.User.is_deleted == False).count()
    approved = db.query(models.User).filter(models.User.role == models.UserRole.student, models.User.is_approved == True, models.User.is_deleted == False).count()
    pending = db.query(models.User).filter(models.User.role == models.UserRole.student, models.User.is_approved == False, models.User.is_deleted == False).count()
    active = db.query(models.User).filter(models.User.role == models.UserRole.student, models.User.is_active == True, models.User.is_deleted == False).count()
    return {"total": total, "approved": approved, "pending_approval": pending, "active": active}


@router.get("/reports/submissions")
def report_submissions(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("view_results")),
):
    subs = db.query(models.Submission).all()
    total = len(subs)
    passed = sum(1 for s in subs if s.passed)
    failed = sum(1 for s in subs if s.passed is False)
    scores = [s.score for s in subs if s.score is not None]
    return {
        "total_submissions": total,
        "passed": passed,
        "failed": failed,
        "pass_rate": round(passed / total * 100, 1) if total else 0,
        "average_score": round(sum(scores) / len(scores), 2) if scores else 0,
        "highest_score": max(scores) if scores else 0,
        "lowest_score": min(scores) if scores else 0,
    }


@router.get("/reports/malpractice")
def report_malpractice(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("view_malpractice")),
):
    logs = db.query(models.MalpracticeLog).all()
    by_type = {}
    for l in logs:
        by_type[l.event_type] = by_type.get(l.event_type, 0) + 1
    students_flagged = len(set(l.student_id for l in logs))
    return {
        "total_events": len(logs),
        "students_flagged": students_flagged,
        "by_type": [{"event_type": k, "count": v} for k, v in sorted(by_type.items(), key=lambda x: -x[1])],
    }


@router.get("/reports/courses")
def report_courses(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_courses")),
):
    courses = db.query(models.Course).filter(models.Course.is_active == True).all()
    result = []
    for c in courses:
        candidate_count = db.query(models.User).filter(
            models.User.course_id == c.id,
            models.User.role == models.UserRole.student,
            models.User.is_deleted == False,
        ).count()
        result.append({
            "id": c.id,
            "name": c.name,
            "code": c.code,
            "candidate_count": candidate_count,
        })
    return result


@router.get("/reports/batches")
def report_batches(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_batches")),
):
    batches = db.query(models.Batch).filter(models.Batch.is_active == True).all()
    result = []
    for b in batches:
        members = db.query(models.BatchMember).filter(models.BatchMember.batch_id == b.id).all()
        student_ids = [m.student_id for m in members]
        subs = db.query(models.Submission).filter(models.Submission.student_id.in_(student_ids)).all() if student_ids else []
        passed = sum(1 for s in subs if s.passed)
        scores = [s.score for s in subs if s.score is not None]
        result.append({
            "id": b.id,
            "name": b.name,
            "member_count": len(members),
            "submissions": len(subs),
            "passed": passed,
            "failed": len(subs) - passed,
            "pass_rate": round(passed / len(subs) * 100, 1) if subs else 0,
            "average_score": round(sum(scores) / len(scores), 2) if scores else 0,
        })
    return result


@router.get("/reports/groups")
def report_groups(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_groups")),
):
    groups = db.query(models.Group).filter(models.Group.is_active == True).all()
    result = []
    for g in groups:
        members = db.query(models.GroupMember).filter(models.GroupMember.group_id == g.id).all()
        student_ids = [m.student_id for m in members]
        subs = db.query(models.Submission).filter(models.Submission.student_id.in_(student_ids)).all() if student_ids else []
        passed = sum(1 for s in subs if s.passed)
        scores = [s.score for s in subs if s.score is not None]
        result.append({
            "id": g.id,
            "name": g.name,
            "member_count": len(members),
            "submissions": len(subs),
            "passed": passed,
            "failed": len(subs) - passed,
            "pass_rate": round(passed / len(subs) * 100, 1) if subs else 0,
            "average_score": round(sum(scores) / len(scores), 2) if scores else 0,
        })
    return result


@router.get("/dashboard-stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("view_results")),
):
    """Summary stats for the admin dashboard."""
    total_candidates = db.query(models.User).filter(
        models.User.role == models.UserRole.student, models.User.is_deleted == False).count()
    pending_approval = db.query(models.User).filter(
        models.User.role == models.UserRole.student,
        models.User.is_approved == False, models.User.is_deleted == False).count()
    total_colleges = db.query(models.College).count()
    total_papers = db.query(models.QuestionPaper).filter(models.QuestionPaper.is_deleted == False).count()
    total_tests = db.query(models.Test).filter(models.Test.is_deleted == False).count()
    total_submissions = db.query(models.Submission).count()
    passed = db.query(models.Submission).filter(models.Submission.passed == True).count()
    total_questions = db.query(models.QuestionBank).filter(
        models.QuestionBank.is_active == True, models.QuestionBank.parent_id == None).count()
    pending_q_approval = db.query(models.QuestionBank).filter(
        models.QuestionBank.approval_status == "pending", models.QuestionBank.is_active == True).count()
    pending_t_approval = db.query(models.Test).filter(
        models.Test.approval_status == "pending", models.Test.is_deleted == False).count()
    malpractice_events = db.query(models.MalpracticeLog).count()
    open_grievances = db.query(models.Grievance).filter(
        models.Grievance.status == models.GrievanceStatus.open).count()
    return {
        "total_candidates": total_candidates,
        "pending_approval": pending_approval,
        "total_colleges": total_colleges,
        "total_papers": total_papers,
        "total_tests": total_tests,
        "total_submissions": total_submissions,
        "passed_submissions": passed,
        "pass_rate": round(passed / total_submissions * 100, 1) if total_submissions else 0,
        "total_questions": total_questions,
        "pending_question_approval": pending_q_approval,
        "pending_test_approval": pending_t_approval,
        "malpractice_events": malpractice_events,
        "open_grievances": open_grievances,
    }


@router.get("/export/candidates")
def export_candidates_csv(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_students")),
):
    """Export all candidates as CSV with BOM for Excel compatibility."""
    from fastapi.responses import StreamingResponse
    import io, csv
    students = db.query(models.User).filter(
        models.User.role == models.UserRole.student,
        models.User.is_deleted == False,
    ).all()
    buf = io.StringIO()
    buf.write('\ufeff')  # BOM for Excel
    writer = csv.writer(buf)
    writer.writerow(["CID", "Full Name", "Email", "Phone", "Aadhaar", "Course ID", "College ID", "Approved", "Active", "Registered"])
    for s in students:
        writer.writerow([
            s.roll_number or "",
            s.full_name or "",
            s.email,
            s.phone or "",
            s.aadhaar or "",
            s.course_id or "",
            s.college_id or "",
            "Yes" if s.is_approved else "No",
            "Yes" if s.is_active else "No",
            s.created_at.strftime("%Y-%m-%d %H:%M") if s.created_at else "",
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv; charset=utf-8-sig",
        headers={"Content-Disposition": "attachment; filename=candidates.csv"},
    )


@router.get("/export/results")
def export_results_csv(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("view_results")),
):
    """Export all submissions/results as CSV with BOM for Excel compatibility."""
    from fastapi.responses import StreamingResponse
    import io, csv
    subs = db.query(models.Submission).all()
    buf = io.StringIO()
    buf.write('\ufeff')  # BOM for Excel
    writer = csv.writer(buf)
    writer.writerow(["Submission ID", "CID", "Full Name", "Email", "Paper ID", "Paper Title", "Score", "Total Marks", "Percentage", "Passed", "Rank", "Submitted At"])
    for s in subs:
        student = s.student
        paper = s.paper
        writer.writerow([
            s.id,
            student.roll_number if student else "",
            student.full_name if student else "",
            student.email if student else "",
            s.paper_id,
            paper.title if paper else "",
            s.score if s.score is not None else "",
            s.total_marks if s.total_marks is not None else "",
            f"{s.percentage:.1f}" if s.percentage is not None else "",
            "Pass" if s.passed else ("Fail" if s.passed is False else ""),
            s.rank if s.rank else "",
            s.submitted_at.strftime("%Y-%m-%d %H:%M") if s.submitted_at else "",
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv; charset=utf-8-sig",
        headers={"Content-Disposition": "attachment; filename=results.csv"},
    )


@router.get("/reports/question-difficulty")
def report_question_difficulty(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("view_results")),
):
    """Per-question pass rate analysis."""
    questions = db.query(models.Question).all()
    result = []
    for q in questions:
        answers = db.query(models.Answer).filter(models.Answer.question_id == q.id).all()
        total = len(answers)
        if total == 0:
            continue
        correct = sum(1 for a in answers if a.selected_option and a.selected_option.upper() == q.correct_option.upper())
        result.append({
            "question_id": q.id,
            "paper_id": q.paper_id,
            "question_text": q.question_text[:80],
            "difficulty": q.difficulty,
            "total_attempts": total,
            "correct": correct,
            "wrong": total - correct,
            "pass_rate": round(correct / total * 100, 1),
        })
    result.sort(key=lambda x: x["pass_rate"])
    return result


@router.get("/trash")
def list_trash(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_students")),
):
    """Returns all soft-deleted items across users and papers."""
    users = db.query(models.User).filter(models.User.is_deleted == True).all()
    papers = db.query(models.QuestionPaper).filter(models.QuestionPaper.is_deleted == True).all()
    return {
        "users": [{"id": u.id, "email": u.email, "role": u.role, "cid": u.roll_number, "full_name": u.full_name} for u in users],
        "papers": [{"id": p.id, "title": p.title, "subject": p.subject} for p in papers],
    }


@router.post("/trash/empty")
def empty_trash(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("manage_students")),
):
    """Permanently delete everything in trash."""
    users = db.query(models.User).filter(models.User.is_deleted == True).all()
    papers = db.query(models.QuestionPaper).filter(models.QuestionPaper.is_deleted == True).all()
    for u in users:
        db.delete(u)
    for p in papers:
        db.delete(p)
    db.commit()
    return {"detail": f"Trash emptied: {len(users)} users, {len(papers)} papers permanently deleted"}
