"""
Per-college database management.
Each college gets its own SQLite DB: data/college_{CODE}.db
"""
import os
from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey,
    DateTime, Text, Enum, create_engine
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import enum

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

CollegeBase = declarative_base()

# ── Per-college models ─────────────────────────────────────────────────────────

class CUserRole(str, enum.Enum):
    staff   = "staff"
    student = "student"


class CStaffProfile(CollegeBase):
    __tablename__ = "staff_profiles"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    full_name   = Column(String, nullable=False)
    designation = Column(String, nullable=True)
    permissions = Column(Text, nullable=False, default="")
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    user        = relationship("CUser", back_populates="staff_profile")


class CUser(CollegeBase):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role            = Column(Enum(CUserRole), default=CUserRole.student, nullable=False)
    roll_number     = Column(String, unique=True, nullable=True)
    full_name       = Column(String, nullable=True)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    staff_profile   = relationship("CStaffProfile", back_populates="user", uselist=False)
    submissions     = relationship("CSubmission", back_populates="student")
    assigned_papers = relationship("CPaperAssignment", back_populates="student")
    malpractice_logs= relationship("CMalpracticeLog", back_populates="student")


class CQuestionPaper(CollegeBase):
    __tablename__ = "question_papers"
    id               = Column(Integer, primary_key=True, index=True)
    title            = Column(String, nullable=False)
    subject          = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=60)
    total_marks      = Column(Integer, nullable=False)
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    questions   = relationship("CQuestion", back_populates="paper", cascade="all, delete-orphan")
    assignments = relationship("CPaperAssignment", back_populates="paper")
    submissions = relationship("CSubmission", back_populates="paper")


class CQuestion(CollegeBase):
    __tablename__ = "questions"
    id             = Column(Integer, primary_key=True, index=True)
    paper_id       = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    question_text  = Column(Text, nullable=False)
    option_a       = Column(String, nullable=False)
    option_b       = Column(String, nullable=False)
    option_c       = Column(String, nullable=False)
    option_d       = Column(String, nullable=False)
    correct_option = Column(String(1), nullable=False)
    marks          = Column(Integer, default=1)
    order_index    = Column(Integer, default=0)
    paper          = relationship("CQuestionPaper", back_populates="questions")


class CPaperAssignment(CollegeBase):
    __tablename__ = "paper_assignments"
    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    paper_id    = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    start_time  = Column(DateTime(timezone=True), nullable=True)
    end_time    = Column(DateTime(timezone=True), nullable=True)
    student     = relationship("CUser", back_populates="assigned_papers")
    paper       = relationship("CQuestionPaper", back_populates="assignments")


class CSubmission(CollegeBase):
    __tablename__ = "submissions"
    id           = Column(Integer, primary_key=True, index=True)
    student_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    paper_id     = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    score        = Column(Integer, nullable=True)
    total_marks  = Column(Integer, nullable=True)
    is_evaluated = Column(Boolean, default=False)
    student      = relationship("CUser", back_populates="submissions")
    paper        = relationship("CQuestionPaper", back_populates="submissions")
    answers      = relationship("CAnswer", back_populates="submission", cascade="all, delete-orphan")


class CAnswer(CollegeBase):
    __tablename__ = "answers"
    id              = Column(Integer, primary_key=True, index=True)
    submission_id   = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    question_id     = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_option = Column(String(1), nullable=True)
    submission      = relationship("CSubmission", back_populates="answers")
    question        = relationship("CQuestion")


class CMalpracticeLog(CollegeBase):
    __tablename__ = "malpractice_logs"
    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    paper_id    = Column(Integer, ForeignKey("question_papers.id"), nullable=True)
    event_type  = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    logged_at   = Column(DateTime(timezone=True), server_default=func.now())
    student     = relationship("CUser", back_populates="malpractice_logs")


# ── Engine registry ────────────────────────────────────────────────────────────

_engines: dict = {}
_sessions: dict = {}


def get_college_db_path(college_code: str) -> str:
    safe_code = college_code.upper().replace(" ", "_")
    return os.path.join(DATA_DIR, f"college_{safe_code}.db")


def get_college_engine(college_code: str):
    code = college_code.upper()
    if code not in _engines:
        db_path = get_college_db_path(code)
        engine = create_engine(
            f"sqlite:///{db_path}",
            connect_args={"check_same_thread": False}
        )
        CollegeBase.metadata.create_all(bind=engine)
        _engines[code] = engine
        _sessions[code] = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _engines[code]


def get_college_session(college_code: str):
    code = college_code.upper()
    get_college_engine(code)  # ensure initialized
    return _sessions[code]()


def init_college_db(college_code: str):
    """Initialize a new college DB. Call when a college is created."""
    engine = get_college_engine(college_code)
    CollegeBase.metadata.create_all(bind=engine)
    return get_college_db_path(college_code)
