from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

from models import UserRole, CollegePlan


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    roll_number: Optional[str] = None
    permissions: Optional[List[str]] = None


# ── Staff Profile ──────────────────────────────────────────────────────────────

class StaffProfileOut(BaseModel):
    id: int
    user_id: int
    designation: Optional[str]
    permissions: List[str]
    created_at: datetime

    @field_validator('permissions', mode='before')
    @classmethod
    def parse_permissions(cls, v):
        if isinstance(v, str):
            return [p.strip() for p in v.split(',') if p.strip()]
        return v or []

    class Config:
        from_attributes = True


# ── User ──────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    email: str
    role: UserRole
    roll_number: Optional[str]   # CID — Candidate ID
    full_name: Optional[str]
    phone: Optional[str] = None
    course_id: Optional[int] = None
    is_active: bool
    is_approved: bool = False
    created_at: datetime
    staff_profile: Optional[StaffProfileOut] = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.student
    full_name: Optional[str] = None
    course_id: Optional[int] = None


class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    course_id: Optional[int] = None


class BulkActionRequest(BaseModel):
    user_ids: List[int]


# ── Staff RBAC ─────────────────────────────────────────────────────────────────

class StaffCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    designation: Optional[str] = None
    permissions: List[str] = []


class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    designation: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None


# ── Question Paper ─────────────────────────────────────────────────────────────

class QuestionPaperCreate(BaseModel):
    title: str
    subject: str
    duration_minutes: int
    total_marks: int
    pass_percentage: float = 40.0
    negative_marks: float = 0.0


class QuestionPaperUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[int] = None
    pass_percentage: Optional[float] = None
    negative_marks: Optional[float] = None
    is_active: Optional[bool] = None


class QuestionPaperOut(BaseModel):
    id: int
    title: str
    subject: str
    duration_minutes: int
    total_marks: int
    pass_percentage: float
    negative_marks: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Question ──────────────────────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    """
    Either supply bank_id to reference an existing bank entry,
    or supply full question content to auto-create one.
    """
    bank_id: Optional[int] = None
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    marks: int = 1
    order_index: int = 0


class QuestionUpdate(BaseModel):
    order_index: Optional[int] = None
    marks: Optional[int] = None   # sets marks_override on the Question slot


class QuestionOut(BaseModel):
    id: int
    paper_id: int
    bank_id: int
    order_index: int
    marks: int
    # Content fields read from bank
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str

    class Config:
        from_attributes = True

    @classmethod
    def from_question(cls, q) -> "QuestionOut":
        return cls(
            id=q.id,
            paper_id=q.paper_id,
            bank_id=q.bank_id,
            order_index=q.order_index,
            marks=q.marks,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct_option=q.correct_option,
        )


class QuestionForStudent(BaseModel):
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    marks: int
    order_index: int

    class Config:
        from_attributes = True

    @classmethod
    def from_question(cls, q) -> "QuestionForStudent":
        return cls(
            id=q.id,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            marks=q.marks,
            order_index=q.order_index,
        )


# ── Paper Assignment ───────────────────────────────────────────────────────────

class AssignPaperRequest(BaseModel):
    student_id: int
    paper_id: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class AssignmentOut(BaseModel):
    id: int
    student_id: int
    paper_id: int
    assigned_at: datetime
    start_time: Optional[datetime]
    end_time: Optional[datetime]

    class Config:
        from_attributes = True


# ── Exam / Submission ──────────────────────────────────────────────────────────

class AnswerItem(BaseModel):
    question_id: int
    selected_option: Optional[str] = None


class SubmitExamRequest(BaseModel):
    paper_id: int
    answers: List[AnswerItem]


class SubmissionOut(BaseModel):
    id: int
    student_id: int
    paper_id: int
    submitted_at: datetime
    score: Optional[float]
    total_marks: Optional[int]   # derived via property from paper
    percentage: Optional[float]
    passed: Optional[bool]
    is_evaluated: bool

    class Config:
        from_attributes = True


class ExamPaperResponse(BaseModel):
    paper: QuestionPaperOut
    questions: List[QuestionForStudent]
    assignment: AssignmentOut


# ── Malpractice ────────────────────────────────────────────────────────────────

class MalpracticeLogCreate(BaseModel):
    paper_id: Optional[int] = None
    event_type: str
    description: Optional[str] = None


class MalpracticeLogOut(BaseModel):
    id: int
    student_id: int
    paper_id: Optional[int]
    event_type: str
    description: Optional[str]
    logged_at: datetime

    class Config:
        from_attributes = True


# ── College ────────────────────────────────────────────────────────────────────

class CollegeCreate(BaseModel):
    name: str
    code: str
    plan: CollegePlan
    seat_limit: int
    subscription_type: Optional[str] = None
    valid_until: Optional[datetime] = None


class CollegeUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[CollegePlan] = None
    seat_limit: Optional[int] = None
    is_active: Optional[bool] = None


class CollegeOut(BaseModel):
    id: int
    name: str
    code: str
    plan: CollegePlan
    seat_limit: int
    is_active: bool
    created_at: datetime
    students_count: Optional[int] = 0
    seats_remaining: Optional[int] = 0

    class Config:
        from_attributes = True


# ── Batch Student Add ──────────────────────────────────────────────────────────

class BatchAddByCount(BaseModel):
    college_id: int
    count: int
    email_domain: str
    default_password: str


class BatchAddByRollRange(BaseModel):
    college_id: int
    roll_start: str
    roll_end: str
    email_domain: str
    default_password: str


class BatchAddResult(BaseModel):
    created: int
    skipped: int
    message: str
    students: List[dict]


# ── Access Request ─────────────────────────────────────────────────────────────

class AccessRequestCreate(BaseModel):
    full_name:  str
    email:      EmailStr
    institute:  str
    code:       str
    plan:       str = "basic"
    seat_limit: int = 100
    message:    Optional[str] = None


class AccessRequestReview(BaseModel):
    status:     str
    admin_note: Optional[str] = None


class AccessRequestOut(BaseModel):
    id:          int
    full_name:   str
    email:       str
    institute:   str
    code:        str
    plan:        str
    seat_limit:  int
    message:     Optional[str]
    status:      str
    admin_note:  Optional[str]
    created_at:  datetime
    reviewed_at: Optional[datetime]

    class Config:
        from_attributes = True
