from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import random as rand_module

from database import get_db
import models
import schemas
from auth import require_student, get_current_user

router = APIRouter(prefix="/exam", tags=["exam"])


# ── Legacy: paper-based exam ───────────────────────────────────────────────────

@router.get("/my-paper", response_model=schemas.ExamPaperResponse)
def get_my_paper(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    assignment = (
        db.query(models.PaperAssignment)
        .filter(models.PaperAssignment.student_id == current_user.id)
        .order_by(models.PaperAssignment.assigned_at.desc())
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="No exam paper assigned to you")

    paper = db.query(models.QuestionPaper).filter(
        models.QuestionPaper.id == assignment.paper_id,
        models.QuestionPaper.is_active == True,
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Assigned paper is not available")

    already_submitted = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id,
        models.Submission.paper_id == paper.id,
    ).first()
    if already_submitted:
        raise HTTPException(status_code=400, detail="You have already submitted this exam")

    questions = (
        db.query(models.Question)
        .filter(models.Question.paper_id == paper.id)
        .order_by(models.Question.order_index)
        .all()
    )

    return schemas.ExamPaperResponse(
        paper=schemas.QuestionPaperOut.model_validate(paper),
        questions=[schemas.QuestionForStudent.from_question(q) for q in questions],
        assignment=schemas.AssignmentOut.model_validate(assignment),
    )


# ── Test-based exam (supports random questions, random options, attempts) ──────

class TestExamResponse(BaseModel):
    test_id: int
    test_name: str
    paper_id: int
    duration_minutes: int
    negative_marks: float
    pass_percentage: float
    attempt_number: int
    max_attempts: int
    questions: List[schemas.QuestionForStudent]


@router.get("/test/{test_id}", response_model=TestExamResponse)
def get_test_exam(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    """Get exam questions for a test-based exam with random selection support."""
    test = db.query(models.Test).filter(
        models.Test.id == test_id,
        models.Test.is_deleted == False,
        models.Test.approval_status == "approved",
    ).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found or not approved")

    # Check test is assigned to this student
    test_ids = _get_student_test_ids(db, current_user.id)
    if test_id not in test_ids:
        raise HTTPException(status_code=403, detail="This test is not assigned to you")

    # Check attempt count
    attempt_count = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id,
        models.Submission.test_id == test_id,
    ).count()
    max_attempts = test.max_attempts or 1
    if attempt_count >= max_attempts:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum attempts ({max_attempts}) reached for this test"
        )

    paper = db.query(models.QuestionPaper).filter(
        models.QuestionPaper.id == test.paper_id,
        models.QuestionPaper.is_active == True,
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Test paper not available")

    questions = db.query(models.Question).filter(
        models.Question.paper_id == paper.id
    ).all()

    # Random question selection
    if test.random_questions and test.total_questions and test.total_questions < len(questions):
        questions = rand_module.sample(questions, test.total_questions)
    else:
        questions.sort(key=lambda q: q.order_index)

    # Build question list, optionally shuffling options
    result_questions = []
    for q in questions:
        qout = schemas.QuestionForStudent.from_question(q)
        if test.random_options:
            # Shuffle options and remap correct answer
            options = [
                ("A", qout.option_a),
                ("B", qout.option_b),
                ("C", qout.option_c),
                ("D", qout.option_d),
            ]
            rand_module.shuffle(options)
            label_map = {orig: new for new, (orig, _) in zip(["A","B","C","D"], options)}
            qout = schemas.QuestionForStudent(
                id=qout.id,
                question_text=qout.question_text,
                option_a=options[0][1],
                option_b=options[1][1],
                option_c=options[2][1],
                option_d=options[3][1],
                marks=qout.marks,
                order_index=qout.order_index,
            )
        result_questions.append(qout)

    return TestExamResponse(
        test_id=test.id,
        test_name=test.name,
        paper_id=paper.id,
        duration_minutes=test.duration_minutes,
        negative_marks=test.negative_marks,
        pass_percentage=test.pass_percentage,
        attempt_number=attempt_count + 1,
        max_attempts=max_attempts,
        questions=result_questions,
    )


def _get_student_test_ids(db, student_id: int) -> set:
    test_ids = set()
    direct = db.query(models.TestAssignment).filter(
        models.TestAssignment.student_id == student_id
    ).all()
    for a in direct:
        test_ids.add(a.test_id)
    for bm in db.query(models.BatchMember).filter(models.BatchMember.student_id == student_id).all():
        for a in db.query(models.TestAssignment).filter(models.TestAssignment.batch_id == bm.batch_id).all():
            test_ids.add(a.test_id)
    for gm in db.query(models.GroupMember).filter(models.GroupMember.student_id == student_id).all():
        for a in db.query(models.TestAssignment).filter(models.TestAssignment.group_id == gm.group_id).all():
            test_ids.add(a.test_id)
    return test_ids


# ── Submit exam ────────────────────────────────────────────────────────────────

@router.post("/submit", response_model=schemas.SubmissionOut)
def submit_exam(
    payload: schemas.SubmitExamRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    assignment = db.query(models.PaperAssignment).filter(
        models.PaperAssignment.student_id == current_user.id,
        models.PaperAssignment.paper_id == payload.paper_id,
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="This paper is not assigned to you")

    already_submitted = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id,
        models.Submission.paper_id == payload.paper_id,
    ).first()
    if already_submitted:
        raise HTTPException(status_code=400, detail="Exam already submitted")

    paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == payload.paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    questions = db.query(models.Question).filter(models.Question.paper_id == payload.paper_id).all()
    question_map = {q.id: q for q in questions}

    score = 0.0
    total = sum(q.marks for q in questions)

    submission = models.Submission(
        student_id=current_user.id,
        paper_id=payload.paper_id,
        is_evaluated=True,
    )
    db.add(submission)
    db.flush()

    for ans in payload.answers:
        q = question_map.get(ans.question_id)
        if not q:
            continue
        selected = ans.selected_option.upper() if ans.selected_option else None
        if selected and selected == q.correct_option.upper():
            score += q.marks
        elif selected and paper.negative_marks > 0:
            score -= paper.negative_marks
        answer = models.Answer(
            submission_id=submission.id,
            question_id=ans.question_id,
            selected_option=selected,
        )
        db.add(answer)

    score = max(0, score)
    percentage = round((score / total * 100), 2) if total > 0 else 0
    passed = percentage >= (paper.pass_percentage or 40.0)

    submission.score = score
    submission.percentage = percentage
    submission.passed = passed
    db.commit()
    db.refresh(submission)
    return submission


class TestSubmitRequest(BaseModel):
    test_id: int
    paper_id: int
    answers: List[schemas.AnswerItem]


@router.post("/submit-test", response_model=schemas.SubmissionOut)
def submit_test_exam(
    payload: TestSubmitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    """Submit a test-based exam. Respects max_attempts."""
    test = db.query(models.Test).filter(models.Test.id == payload.test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    # Check attempt limit
    attempt_count = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id,
        models.Submission.test_id == payload.test_id,
    ).count()
    if attempt_count >= (test.max_attempts or 1):
        raise HTTPException(status_code=400, detail="Maximum attempts reached")

    paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == payload.paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    questions = db.query(models.Question).filter(models.Question.paper_id == payload.paper_id).all()
    question_map = {q.id: q for q in questions}

    score = 0.0
    total = sum(q.marks for q in questions)
    neg = test.negative_marks

    submission = models.Submission(
        student_id=current_user.id,
        paper_id=payload.paper_id,
        test_id=payload.test_id,
        is_evaluated=True,
    )
    db.add(submission)
    db.flush()

    for ans in payload.answers:
        q = question_map.get(ans.question_id)
        if not q:
            continue
        selected = ans.selected_option.upper() if ans.selected_option else None
        if selected and selected == q.correct_option.upper():
            score += q.marks
        elif selected and neg > 0:
            score -= neg
        db.add(models.Answer(
            submission_id=submission.id,
            question_id=ans.question_id,
            selected_option=selected,
        ))

    score = max(0, score)
    percentage = round((score / total * 100), 2) if total > 0 else 0
    passed = percentage >= test.pass_percentage

    submission.score = score
    submission.percentage = percentage
    submission.passed = passed
    db.commit()

    # Recalculate ranks for this test
    from routers.certificate_router import _recalculate_ranks
    _recalculate_ranks(db, payload.test_id)

    db.refresh(submission)
    return submission


@router.post("/log-malpractice", response_model=schemas.MalpracticeLogOut)
def log_malpractice(
    payload: schemas.MalpracticeLogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    log = models.MalpracticeLog(
        student_id=current_user.id,
        paper_id=payload.paper_id,
        event_type=payload.event_type,
        description=payload.description,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/my-results", response_model=List[schemas.SubmissionOut])
def my_results(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    return db.query(models.Submission).filter(models.Submission.student_id == current_user.id).all()


@router.get("/my-results/{submission_id}/review")
def review_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id,
        models.Submission.student_id == current_user.id,
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    paper = db.query(models.QuestionPaper).filter(
        models.QuestionPaper.id == submission.paper_id
    ).first()

    answers = db.query(models.Answer).filter(
        models.Answer.submission_id == submission_id
    ).all()
    answer_map = {a.question_id: a.selected_option for a in answers}

    questions = db.query(models.Question).filter(
        models.Question.paper_id == submission.paper_id
    ).order_by(models.Question.order_index).all()

    review_questions = []
    for q in questions:
        selected = answer_map.get(q.id)
        is_correct = selected is not None and selected.upper() == q.correct_option.upper()
        review_questions.append({
            "id": q.id,
            "order_index": q.order_index,
            "question_text": q.question_text,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "correct_option": q.correct_option,
            "selected_option": selected,
            "is_correct": is_correct,
            "marks": q.marks,
            "marks_obtained": q.marks if is_correct else 0,
        })

    return {
        "submission_id": submission.id,
        "paper_id": submission.paper_id,
        "paper_title": paper.title if paper else "--",
        "paper_subject": paper.subject if paper else "--",
        "score": submission.score,
        "total_marks": submission.total_marks,
        "submitted_at": submission.submitted_at,
        "questions": review_questions,
    }
