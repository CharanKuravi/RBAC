from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import require_admin_or_staff

router = APIRouter(prefix="/admin/lookup", tags=["lookup"])


@router.get("/paper/{paper_id}")
def lookup_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin_or_staff),
):
    paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail=f"No paper found with Set ID {paper_id}")

    questions = db.query(models.Question).filter(
        models.Question.paper_id == paper_id
    ).order_by(models.Question.order_index).all()

    assignments = db.query(models.PaperAssignment).filter(
        models.PaperAssignment.paper_id == paper_id
    ).all()

    submissions = db.query(models.Submission).filter(
        models.Submission.paper_id == paper_id
    ).all()

    return {
        "type": "paper",
        "id": paper.id,
        "title": paper.title,
        "subject": paper.subject,
        "duration_minutes": paper.duration_minutes,
        "total_marks": paper.total_marks,
        "is_active": paper.is_active,
        "created_at": paper.created_at,
        "question_count": len(questions),
        "assigned_to": len(assignments),
        "submissions": len(submissions),
        "questions": [
            {
                "id": q.id,
                "order": q.order_index + 1,
                "question_text": q.question_text,
                "marks": q.marks,
                "correct_option": q.correct_option,
            }
            for q in questions
        ],
    }


@router.get("/question/{question_id}")
def lookup_question(
    question_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin_or_staff),
):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail=f"No question found with ID {question_id}")

    paper = db.query(models.QuestionPaper).filter(
        models.QuestionPaper.id == question.paper_id
    ).first()

    return {
        "type": "question",
        "id": question.id,
        "question_text": question.question_text,
        "option_a": question.option_a,
        "option_b": question.option_b,
        "option_c": question.option_c,
        "option_d": question.option_d,
        "correct_option": question.correct_option,
        "marks": question.marks,
        "order_index": question.order_index,
        "belongs_to_paper": {
            "id": paper.id,
            "title": paper.title,
            "subject": paper.subject,
        } if paper else None,
    }


@router.get("/user/{user_id}")
def lookup_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin_or_staff),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"No user found with ID {user_id}")

    result = {
        "type": "user",
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
    }

    if user.role == models.UserRole.student:
        result["roll_number"] = user.roll_number

        assignments = db.query(models.PaperAssignment).filter(
            models.PaperAssignment.student_id == user.id
        ).all()
        submissions = db.query(models.Submission).filter(
            models.Submission.student_id == user.id
        ).all()
        malpractice = db.query(models.MalpracticeLog).filter(
            models.MalpracticeLog.student_id == user.id
        ).count()

        result["assigned_papers"] = [
            {"paper_id": a.paper_id, "assigned_at": a.assigned_at}
            for a in assignments
        ]
        result["submissions"] = [
            {
                "paper_id": s.paper_id,
                "score": s.score,
                "total_marks": s.total_marks,
                "submitted_at": s.submitted_at,
            }
            for s in submissions
        ]
        result["malpractice_events"] = malpractice

    elif user.role == models.UserRole.staff and user.staff_profile:
        profile = user.staff_profile
        result["full_name"] = user.full_name  # full_name is on User, not StaffProfile
        result["designation"] = profile.designation
        result["permissions"] = [
            p.strip() for p in (profile.permissions or "").split(",") if p.strip()
        ]

    return result


@router.get("/roll/{roll_number}")
def lookup_by_roll(
    roll_number: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin_or_staff),
):
    user = db.query(models.User).filter(
        models.User.roll_number == roll_number.upper()
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"No student found with roll number {roll_number.upper()}")

    assignments = db.query(models.PaperAssignment).filter(
        models.PaperAssignment.student_id == user.id
    ).all()
    submissions = db.query(models.Submission).filter(
        models.Submission.student_id == user.id
    ).all()
    malpractice = db.query(models.MalpracticeLog).filter(
        models.MalpracticeLog.student_id == user.id
    ).count()

    return {
        "type": "user",
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "roll_number": user.roll_number,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "assigned_papers": [
            {"paper_id": a.paper_id, "assigned_at": a.assigned_at}
            for a in assignments
        ],
        "submissions": [
            {
                "paper_id": s.paper_id,
                "score": s.score,
                "total_marks": s.total_marks,
                "submitted_at": s.submitted_at,
            }
            for s in submissions
        ],
        "malpractice_events": malpractice,
    }
