from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import re

from database import get_db
import models
from auth import require_permission, get_current_user, log_audit

router = APIRouter(prefix="/question-bank", tags=["question_bank"])


def _generate_qb_uid(db: Session, subject: Optional[str], qid: int) -> str:
    """Generate QB UID: zero-padded number + 2-letter subject abbreviation."""
    if subject:
        abbr = re.sub(r'[^A-Za-z]', '', subject)[:2].upper() or 'QB'
    else:
        abbr = 'QB'
    num_str = str(qid).zfill(2) if qid < 100 else str(qid)
    uid = f"{num_str}{abbr}"
    # Ensure uniqueness
    existing = db.query(models.QuestionBank).filter(models.QuestionBank.qb_uid == uid).first()
    if existing and existing.id != qid:
        uid = f"{num_str}{abbr}{qid}"
    return uid


class QuestionBankCreate(BaseModel):
    question_type: str = "mcq_single"
    question_text: str
    # MCQ fields
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None    # single: "A"
    correct_options: Optional[str] = None   # multi: "A,C"
    # Fill/Short answer
    answer_text: Optional[str] = None
    # Matching pairs JSON
    matching_pairs: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: str = "medium"
    marks: int = 1


class QuestionBankUpdate(BaseModel):
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    correct_options: Optional[str] = None
    answer_text: Optional[str] = None
    matching_pairs: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    marks: Optional[int] = None


class QuestionBankOut(BaseModel):
    id: int
    qb_uid: Optional[str]
    question_type: str
    question_text: str
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]
    correct_option: Optional[str]
    correct_options: Optional[str]
    answer_text: Optional[str]
    matching_pairs: Optional[str]
    subject: Optional[str]
    topic: Optional[str]
    difficulty: str
    marks: int
    version: int
    is_active: bool
    approval_status: str
    approval_note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ApprovalRequest(BaseModel):
    status: str   # approved | rejected
    note: Optional[str] = None


@router.get("/by-uid/{uid}", response_model=QuestionBankOut)
def get_by_uid(
    uid: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_papers")),
):
    """Lookup a question by its QB UID (e.g. 09DS). Returns 404 if not found."""
    q = db.query(models.QuestionBank).filter(
        models.QuestionBank.qb_uid == uid.upper(),
        models.QuestionBank.is_active == True,
    ).first()
    if not q:
        raise HTTPException(status_code=404, detail=f"Invalid QB UID: {uid.upper()}")
    return q


@router.get("", response_model=List[QuestionBankOut])
def list_questions(
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    keyword: Optional[str] = None,
    question_type: Optional[str] = None,
    approval_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_question_bank")),
):
    q = db.query(models.QuestionBank).filter(
        models.QuestionBank.is_active == True,
        models.QuestionBank.parent_id == None,
    )
    if subject:
        q = q.filter(models.QuestionBank.subject.ilike(f"%{subject}%"))
    if topic:
        q = q.filter(models.QuestionBank.topic.ilike(f"%{topic}%"))
    if difficulty:
        q = q.filter(models.QuestionBank.difficulty == difficulty)
    if keyword:
        q = q.filter(models.QuestionBank.question_text.ilike(f"%{keyword}%"))
    if question_type:
        q = q.filter(models.QuestionBank.question_type == question_type)
    if approval_status:
        q = q.filter(models.QuestionBank.approval_status == approval_status)
    else:
        # Default: only show approved questions in normal listing
        q = q.filter(models.QuestionBank.approval_status == "approved")
    return q.order_by(models.QuestionBank.id.desc()).all()


@router.get("/pending-approval", response_model=List[QuestionBankOut])
def list_pending_questions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_question_bank")),
):
    """Questions awaiting admin approval."""
    return db.query(models.QuestionBank).filter(
        models.QuestionBank.approval_status == "pending",
        models.QuestionBank.is_active == True,
    ).order_by(models.QuestionBank.created_at.desc()).all()


@router.get("/{qb_id}", response_model=QuestionBankOut)
def get_question(
    qb_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_question_bank")),
):
    q = db.query(models.QuestionBank).filter(models.QuestionBank.id == qb_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


@router.post("", response_model=QuestionBankOut)
def create_question(
    payload: QuestionBankCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_question_bank")),
):
    qtype = payload.question_type

    # Validate based on type
    if qtype in ("mcq_single", "mcq_multi"):
        if not all([payload.option_a, payload.option_b, payload.option_c, payload.option_d]):
            raise HTTPException(status_code=400, detail="MCQ requires all 4 options")
        if qtype == "mcq_single":
            if not payload.correct_option or payload.correct_option.upper() not in ("A", "B", "C", "D"):
                raise HTTPException(status_code=400, detail="correct_option must be A, B, C, or D")
        else:
            if not payload.correct_options:
                raise HTTPException(status_code=400, detail="correct_options required for multi-answer MCQ (e.g. 'A,C')")
    elif qtype in ("fill_blank", "short_ans"):
        if not payload.answer_text:
            raise HTTPException(status_code=400, detail="answer_text required for fill/short answer questions")
    elif qtype == "matching":
        if not payload.matching_pairs:
            raise HTTPException(status_code=400, detail="matching_pairs JSON required for matching questions")

    # Full access roles auto-approve; others go to pending
    is_full_access = current_user.role in models.FULL_ACCESS_ROLES
    approval = "approved" if is_full_access else "pending"

    q = models.QuestionBank(
        question_type=qtype,
        question_text=payload.question_text,
        option_a=payload.option_a,
        option_b=payload.option_b,
        option_c=payload.option_c,
        option_d=payload.option_d,
        correct_option=payload.correct_option.upper() if payload.correct_option else None,
        correct_options=payload.correct_options,
        answer_text=payload.answer_text,
        matching_pairs=payload.matching_pairs,
        subject=payload.subject,
        topic=payload.topic,
        difficulty=payload.difficulty,
        marks=payload.marks,
        approval_status=approval,
        created_by_id=current_user.id,
    )
    db.add(q)
    db.flush()
    # Generate QB UID after we have the ID
    q.qb_uid = _generate_qb_uid(db, payload.subject, q.id)
    log_audit(db, current_user, "CREATE_BANK_QUESTION", "QuestionBank", q.id)
    db.commit()
    db.refresh(q)
    return q


@router.post("/{qb_id}/approve")
def approve_question(
    qb_id: int,
    payload: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_question_bank")),
):
    if current_user.role not in models.FULL_ACCESS_ROLES:
        raise HTTPException(status_code=403, detail="Only admins can approve questions")
    q = db.query(models.QuestionBank).filter(models.QuestionBank.id == qb_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    if payload.status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be approved or rejected")
    q.approval_status = payload.status
    q.approval_note = payload.note
    log_audit(db, current_user, f"QUESTION_{payload.status.upper()}", "QuestionBank", qb_id, payload.note)
    db.commit()
    return {"detail": f"Question {payload.status}", "id": qb_id}


@router.patch("/{qb_id}", response_model=QuestionBankOut)
def update_question(
    qb_id: int,
    payload: QuestionBankUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_question_bank")),
):
    """Editing creates a new version; old version is archived."""
    old = db.query(models.QuestionBank).filter(models.QuestionBank.id == qb_id).first()
    if not old:
        raise HTTPException(status_code=404, detail="Question not found")

    old.is_active = False

    is_full_access = current_user.role in models.FULL_ACCESS_ROLES
    approval = "approved" if is_full_access else "pending"

    new_q = models.QuestionBank(
        question_type=old.question_type,
        question_text=payload.question_text or old.question_text,
        option_a=payload.option_a or old.option_a,
        option_b=payload.option_b or old.option_b,
        option_c=payload.option_c or old.option_c,
        option_d=payload.option_d or old.option_d,
        correct_option=payload.correct_option or old.correct_option,
        correct_options=payload.correct_options or old.correct_options,
        answer_text=payload.answer_text or old.answer_text,
        matching_pairs=payload.matching_pairs or old.matching_pairs,
        subject=payload.subject if payload.subject is not None else old.subject,
        topic=payload.topic if payload.topic is not None else old.topic,
        difficulty=payload.difficulty or old.difficulty,
        marks=payload.marks or old.marks,
        version=old.version + 1,
        parent_id=old.id,
        approval_status=approval,
        created_by_id=current_user.id,
    )
    db.add(new_q)
    db.flush()
    log_audit(db, current_user, "UPDATE_BANK_QUESTION", "QuestionBank", qb_id, f"New version {new_q.version}")
    db.commit()
    db.refresh(new_q)
    return new_q


@router.delete("/{qb_id}")
def archive_question(
    qb_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_question_bank")),
):
    q = db.query(models.QuestionBank).filter(models.QuestionBank.id == qb_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    q.is_active = False
    log_audit(db, current_user, "ARCHIVE_BANK_QUESTION", "QuestionBank", qb_id)
    db.commit()
    return {"detail": "Question archived"}
