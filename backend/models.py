from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


# ── Enums ──────────────────────────────────────────────────────────────────────

class QuestionType(str, enum.Enum):
    mcq_single  = "mcq_single"   # single correct answer
    mcq_multi   = "mcq_multi"    # multiple correct answers
    fill_blank  = "fill_blank"   # fill in the blank
    short_ans   = "short_ans"    # short answer
    matching    = "matching"     # matching pairs


class ApprovalStatus(str, enum.Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"


class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    it_coordinator = "it_coordinator"
    admin = "admin"
    staff = "staff"
    student = "student"


class SubscriptionType(str, enum.Enum):
    monthly   = "monthly"
    quarterly = "quarterly"
    yearly    = "yearly"


class CollegePlan(str, enum.Enum):
    basic    = "basic"
    limited  = "limited"
    standard = "standard"
    premium  = "premium"


class DifficultyLevel(str, enum.Enum):
    easy     = "easy"
    medium   = "medium"
    hard     = "hard"


class PaperStatus(str, enum.Enum):
    draft     = "draft"
    published = "published"
    archived  = "archived"


class TestStatus(str, enum.Enum):
    upcoming  = "upcoming"
    live      = "live"
    completed = "completed"
    archived  = "archived"


class GrievanceStatus(str, enum.Enum):
    open        = "open"
    in_progress = "in_progress"
    resolved    = "resolved"


class AccessRequestStatus(str, enum.Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"


# ── Constants ──────────────────────────────────────────────────────────────────

PLAN_LIMITS = {
    CollegePlan.basic:    600,
    CollegePlan.limited:  1800,
    CollegePlan.standard: 3000,
    CollegePlan.premium:  5000,
}
PLAN_MIN = 100

AVAILABLE_PERMISSIONS = [
    "manage_students",
    "manage_papers",
    "manage_assignments",
    "view_submissions",
    "view_malpractice",
    "manage_courses",
    "manage_batches",
    "manage_groups",
    "manage_tests",
    "manage_question_bank",
    "view_results",
    "manage_grievances",
    "view_audit_log",
]

# Roles that have full admin-level access
FULL_ACCESS_ROLES = {UserRole.super_admin, UserRole.it_coordinator, UserRole.admin}


# ── College ────────────────────────────────────────────────────────────────────

class College(Base):
    __tablename__ = "colleges"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    code        = Column(String, unique=True, nullable=False, index=True)
    plan        = Column(Enum(CollegePlan), nullable=False, default=CollegePlan.basic)
    subscription_type = Column(Enum(SubscriptionType), nullable=True)  # monthly/quarterly/yearly
    seat_limit  = Column(Integer, nullable=False)
    is_active   = Column(Boolean, default=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    students = relationship("User", back_populates="college")
    courses  = relationship("Course", back_populates="college", cascade="all, delete-orphan")
    batches  = relationship("Batch", back_populates="college", cascade="all, delete-orphan")
    groups   = relationship("Group", back_populates="college", cascade="all, delete-orphan")


# ── Course ─────────────────────────────────────────────────────────────────────

class Course(Base):
    __tablename__ = "courses"

    id          = Column(Integer, primary_key=True, index=True)
    college_id  = Column(Integer, ForeignKey("colleges.id"), nullable=True)
    name        = Column(String, nullable=False)
    code        = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    college  = relationship("College", back_populates="courses")
    batches  = relationship("Batch", back_populates="course")
    papers   = relationship("QuestionPaper", back_populates="course")


# ── Batch ──────────────────────────────────────────────────────────────────────

class Batch(Base):
    __tablename__ = "batches"

    id         = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True)
    course_id  = Column(Integer, ForeignKey("courses.id"), nullable=True)
    name       = Column(String, nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date   = Column(DateTime(timezone=True), nullable=True)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    college  = relationship("College", back_populates="batches")
    course   = relationship("Course", back_populates="batches")
    members  = relationship("BatchMember", back_populates="batch", cascade="all, delete-orphan")
    groups   = relationship("Group", back_populates="batch")


class BatchMember(Base):
    __tablename__ = "batch_members"

    id         = Column(Integer, primary_key=True, index=True)
    batch_id   = Column(Integer, ForeignKey("batches.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at  = Column(DateTime(timezone=True), server_default=func.now())

    batch   = relationship("Batch", back_populates="members")
    student = relationship("User", back_populates="batch_memberships")


# ── Group ──────────────────────────────────────────────────────────────────────

class Group(Base):
    __tablename__ = "groups"

    id          = Column(Integer, primary_key=True, index=True)
    college_id  = Column(Integer, ForeignKey("colleges.id"), nullable=True)
    batch_id    = Column(Integer, ForeignKey("batches.id"), nullable=True)
    name        = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    college = relationship("College", back_populates="groups")
    batch   = relationship("Batch", back_populates="groups")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    __tablename__ = "group_members"

    id         = Column(Integer, primary_key=True, index=True)
    group_id   = Column(Integer, ForeignKey("groups.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at  = Column(DateTime(timezone=True), server_default=func.now())

    group   = relationship("Group", back_populates="members")
    student = relationship("User", back_populates="group_memberships")


# ── Staff Profile ──────────────────────────────────────────────────────────────

class StaffProfile(Base):
    """
    Stores staff-specific metadata. full_name lives on User; this holds
    designation and the comma-separated permissions string.
    """
    __tablename__ = "staff_profiles"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    designation = Column(String, nullable=True)
    permissions = Column(Text, nullable=False, default="")
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="staff_profile")


# ── User ───────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    username        = Column(String, unique=True, nullable=True, index=True)  # optional username login
    hashed_password = Column(String, nullable=False)
    role            = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    roll_number     = Column(String, unique=True, nullable=True)   # CID — Candidate ID
    full_name       = Column(String, nullable=True)
    phone           = Column(String, nullable=True)
    aadhaar         = Column(String, nullable=True)                # Aadhaar number (hashed/masked)
    college_id      = Column(Integer, ForeignKey("colleges.id"), nullable=True)
    course_id       = Column(Integer, ForeignKey("courses.id"), nullable=True)
    is_active       = Column(Boolean, default=True)
    is_approved     = Column(Boolean, default=False)
    is_email_verified = Column(Boolean, default=False)             # email verification
    is_deleted      = Column(Boolean, default=False)
    last_login      = Column(DateTime(timezone=True), nullable=True)
    session_token   = Column(String, nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    college           = relationship("College", back_populates="students")
    staff_profile     = relationship("StaffProfile", back_populates="user", uselist=False)
    submissions       = relationship("Submission", back_populates="student")
    assigned_papers   = relationship("PaperAssignment", back_populates="student")
    malpractice_logs  = relationship("MalpracticeLog", back_populates="student")
    batch_memberships = relationship("BatchMember", back_populates="student")
    group_memberships = relationship("GroupMember", back_populates="student")
    grievances        = relationship("Grievance", back_populates="student")
    feedbacks         = relationship("Feedback", back_populates="student")
    audit_logs        = relationship("AuditLog", back_populates="actor", foreign_keys="AuditLog.actor_id")


# ── Question Bank ──────────────────────────────────────────────────────────────

class QuestionBank(Base):
    """
    Centralised, deduplicated question repository.
    Supports MCQ (single/multi), Fill in the Blank, Short Answer, Matching.
    """
    __tablename__ = "question_bank"

    id              = Column(Integer, primary_key=True, index=True)
    qb_uid          = Column(String, nullable=True, index=True)   # e.g. "09DS", "900DS"
    question_type   = Column(Enum(QuestionType), default=QuestionType.mcq_single, nullable=False)
    question_text   = Column(Text, nullable=False)
    # MCQ options (used for mcq_single and mcq_multi)
    option_a        = Column(String, nullable=True)
    option_b        = Column(String, nullable=True)
    option_c        = Column(String, nullable=True)
    option_d        = Column(String, nullable=True)
    correct_option  = Column(String(1), nullable=True)   # single answer: A/B/C/D
    correct_options = Column(String, nullable=True)      # multi-answer: "A,C" comma-separated
    # Fill in blank / short answer
    answer_text     = Column(Text, nullable=True)
    # Matching: stored as JSON string [{"left":"..","right":".."}]
    matching_pairs  = Column(Text, nullable=True)
    subject         = Column(String, nullable=True)
    topic           = Column(String, nullable=True)
    difficulty      = Column(Enum(DifficultyLevel), default=DifficultyLevel.medium, nullable=False)
    marks           = Column(Integer, default=1)
    is_active       = Column(Boolean, default=True)
    approval_status = Column(Enum(ApprovalStatus), default=ApprovalStatus.approved, nullable=False)
    approval_note   = Column(Text, nullable=True)
    version         = Column(Integer, default=1)
    parent_id       = Column(Integer, ForeignKey("question_bank.id"), nullable=True)
    created_by_id   = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    versions = relationship("QuestionBank", foreign_keys=[parent_id])


# ── Question Paper ─────────────────────────────────────────────────────────────

class QuestionPaper(Base):
    __tablename__ = "question_papers"

    id               = Column(Integer, primary_key=True, index=True)
    title            = Column(String, nullable=False)
    subject          = Column(String, nullable=False)
    course_id        = Column(Integer, ForeignKey("courses.id"), nullable=True)
    duration_minutes = Column(Integer, nullable=False, default=60)
    total_marks      = Column(Integer, nullable=False)
    pass_percentage  = Column(Float, default=40.0)
    negative_marks   = Column(Float, default=0.0)
    status           = Column(Enum(PaperStatus), default=PaperStatus.draft, nullable=False)
    is_active        = Column(Boolean, default=True)
    is_deleted       = Column(Boolean, default=False)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    course      = relationship("Course", back_populates="papers")
    questions   = relationship("Question", back_populates="paper", cascade="all, delete-orphan")
    assignments = relationship("PaperAssignment", back_populates="paper")
    submissions = relationship("Submission", back_populates="paper")
    tests       = relationship("Test", back_populates="paper")


# ── Question ───────────────────────────────────────────────────────────────────

class Question(Base):
    """
    A question slot in a paper. All content (text, options, answer) is stored
    in QuestionBank and referenced via bank_id — no duplication.
    marks_override allows per-paper mark weighting; if NULL, bank.marks is used.
    """
    __tablename__ = "questions"

    id             = Column(Integer, primary_key=True, index=True)
    paper_id       = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    bank_id        = Column(Integer, ForeignKey("question_bank.id"), nullable=False)
    order_index    = Column(Integer, default=0)
    marks_override = Column(Integer, nullable=True)  # NULL → use bank.marks

    paper = relationship("QuestionPaper", back_populates="questions")
    bank  = relationship("QuestionBank", foreign_keys=[bank_id])

    @property
    def marks(self):
        return self.marks_override if self.marks_override is not None else (self.bank.marks if self.bank else 1)

    # Convenience pass-throughs so existing router code keeps working
    @property
    def question_text(self):  return self.bank.question_text if self.bank else ""
    @property
    def option_a(self):       return self.bank.option_a if self.bank else ""
    @property
    def option_b(self):       return self.bank.option_b if self.bank else ""
    @property
    def option_c(self):       return self.bank.option_c if self.bank else ""
    @property
    def option_d(self):       return self.bank.option_d if self.bank else ""
    @property
    def correct_option(self): return self.bank.correct_option if self.bank else ""
    @property
    def subject(self):        return self.bank.subject if self.bank else None
    @property
    def topic(self):          return self.bank.topic if self.bank else None
    @property
    def difficulty(self):     return self.bank.difficulty if self.bank else None


# ── Test ───────────────────────────────────────────────────────────────────────

class Test(Base):
    """
    A scheduled test instance linked to a paper.
    duration_minutes, negative_marks, and pass_percentage are inherited from
    the linked QuestionPaper unless explicitly overridden here (nullable).
    """
    __tablename__ = "tests"

    id                       = Column(Integer, primary_key=True, index=True)
    name                     = Column(String, nullable=False)
    code                     = Column(String, nullable=True)
    paper_id                 = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    course_id                = Column(Integer, ForeignKey("courses.id"), nullable=True)
    scheduled_date           = Column(DateTime(timezone=True), nullable=True)
    start_time               = Column(DateTime(timezone=True), nullable=True)
    end_time                 = Column(DateTime(timezone=True), nullable=True)
    total_questions          = Column(Integer, nullable=True)   # random selection cap
    max_attempts             = Column(Integer, default=1)       # how many times candidate can attempt
    random_questions         = Column(Boolean, default=False)   # draw random subset from paper
    random_options           = Column(Boolean, default=False)   # shuffle option order per candidate
    approval_status          = Column(Enum(ApprovalStatus), default=ApprovalStatus.pending, nullable=False)
    approval_note            = Column(Text, nullable=True)
    # Per-test overrides — NULL means inherit from paper
    duration_minutes_override = Column(Integer, nullable=True)
    negative_marks_override   = Column(Float, nullable=True)
    pass_percentage_override  = Column(Float, nullable=True)
    status                   = Column(Enum(TestStatus), default=TestStatus.upcoming, nullable=False)
    is_deleted               = Column(Boolean, default=False)
    created_at               = Column(DateTime(timezone=True), server_default=func.now())

    paper       = relationship("QuestionPaper", back_populates="tests")
    course      = relationship("Course")
    assignments = relationship("TestAssignment", back_populates="test", cascade="all, delete-orphan")

    @property
    def duration_minutes(self):
        return self.duration_minutes_override if self.duration_minutes_override is not None \
            else (self.paper.duration_minutes if self.paper else 60)

    @property
    def negative_marks(self):
        return self.negative_marks_override if self.negative_marks_override is not None \
            else (self.paper.negative_marks if self.paper else 0.0)

    @property
    def pass_percentage(self):
        return self.pass_percentage_override if self.pass_percentage_override is not None \
            else (self.paper.pass_percentage if self.paper else 40.0)


class TestAssignment(Base):
    """Assigns a test to a student, batch, or group."""
    __tablename__ = "test_assignments"

    id          = Column(Integer, primary_key=True, index=True)
    test_id     = Column(Integer, ForeignKey("tests.id"), nullable=False)
    student_id  = Column(Integer, ForeignKey("users.id"), nullable=True)
    batch_id    = Column(Integer, ForeignKey("batches.id"), nullable=True)
    group_id    = Column(Integer, ForeignKey("groups.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    test    = relationship("Test", back_populates="assignments")
    student = relationship("User")
    batch   = relationship("Batch")
    group   = relationship("Group")


# ── Paper Assignment (legacy — direct paper-to-student assignment) ─────────────

class PaperAssignment(Base):
    """
    Legacy direct assignment of a paper to a student with a time window.
    New code should use Test + TestAssignment instead.
    Kept for backward compatibility with existing exam_router flows.
    """
    __tablename__ = "paper_assignments"

    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    paper_id    = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    start_time  = Column(DateTime(timezone=True), nullable=True)
    end_time    = Column(DateTime(timezone=True), nullable=True)

    student = relationship("User", back_populates="assigned_papers")
    paper   = relationship("QuestionPaper", back_populates="assignments")


# ── Submission ─────────────────────────────────────────────────────────────────

class Submission(Base):
    __tablename__ = "submissions"

    id           = Column(Integer, primary_key=True, index=True)
    student_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    paper_id     = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    test_id      = Column(Integer, ForeignKey("tests.id"), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at   = Column(DateTime(timezone=True), nullable=True)   # attendance tracking
    score        = Column(Float, nullable=True)
    rank         = Column(Integer, nullable=True)                   # rank among all submissions for same test
    percentage   = Column(Float, nullable=True)
    passed       = Column(Boolean, nullable=True)
    is_evaluated = Column(Boolean, default=False)
    is_published = Column(Boolean, default=False)

    student = relationship("User", back_populates="submissions")
    paper   = relationship("QuestionPaper", back_populates="submissions")
    answers = relationship("Answer", back_populates="submission", cascade="all, delete-orphan")

    @property
    def total_marks(self):
        return self.paper.total_marks if self.paper else None


# ── Answer ─────────────────────────────────────────────────────────────────────

class Answer(Base):
    __tablename__ = "answers"

    id               = Column(Integer, primary_key=True, index=True)
    submission_id    = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    question_id      = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_option  = Column(String(1), nullable=True)    # single MCQ
    selected_options = Column(String, nullable=True)       # multi MCQ: "A,C"
    answer_text      = Column(Text, nullable=True)         # fill/short answer text

    submission = relationship("Submission", back_populates="answers")
    question   = relationship("Question")


# ── Malpractice Log ────────────────────────────────────────────────────────────

class MalpracticeLog(Base):
    __tablename__ = "malpractice_logs"

    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    paper_id    = Column(Integer, ForeignKey("question_papers.id"), nullable=True)
    event_type  = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    logged_at   = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="malpractice_logs")


# ── Certificate ────────────────────────────────────────────────────────────────

class Certificate(Base):
    __tablename__ = "certificates"

    id             = Column(Integer, primary_key=True, index=True)
    cert_id        = Column(String, unique=True, nullable=False, index=True)  # unique cert code
    student_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    submission_id  = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    test_id        = Column(Integer, ForeignKey("tests.id"), nullable=True)
    paper_id       = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    issued_at      = Column(DateTime(timezone=True), server_default=func.now())
    is_approved    = Column(Boolean, default=False)   # admin approves before candidate can download
    approved_at    = Column(DateTime(timezone=True), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    student     = relationship("User", foreign_keys=[student_id])
    submission  = relationship("Submission")
    approved_by = relationship("User", foreign_keys=[approved_by_id])


# ── Attendance ─────────────────────────────────────────────────────────────────

class Attendance(Base):
    """Tracks whether a candidate started an assigned test."""
    __tablename__ = "attendance"

    id         = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    test_id    = Column(Integer, ForeignKey("tests.id"), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    status     = Column(String, default="present")   # present | absent

    student = relationship("User")
    test    = relationship("Test")


# ── Grievance ──────────────────────────────────────────────────────────────────

class Grievance(Base):
    __tablename__ = "grievances"

    id          = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String, unique=True, nullable=False, index=True)
    student_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject     = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status      = Column(Enum(GrievanceStatus), default=GrievanceStatus.open, nullable=False)
    admin_note  = Column(Text, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    student = relationship("User", back_populates="grievances")


# ── Feedback ───────────────────────────────────────────────────────────────────

class Feedback(Base):
    __tablename__ = "feedbacks"

    id         = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    paper_id   = Column(Integer, ForeignKey("question_papers.id"), nullable=True)
    test_id    = Column(Integer, ForeignKey("tests.id"), nullable=True)
    rating     = Column(Integer, nullable=True)
    comment    = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="feedbacks")


# ── Audit Log ──────────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id          = Column(Integer, primary_key=True, index=True)
    actor_id    = Column(Integer, ForeignKey("users.id"), nullable=True)
    # actor_email is intentionally denormalised: preserves the email in the audit
    # trail even if the user account is later deleted.
    actor_email = Column(String, nullable=True)
    action      = Column(String, nullable=False)
    entity_type = Column(String, nullable=True)
    entity_id   = Column(String, nullable=True)
    detail      = Column(Text, nullable=True)
    ip_address  = Column(String, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    actor = relationship("User", back_populates="audit_logs", foreign_keys=[actor_id])


# ── Access Request ─────────────────────────────────────────────────────────────

class AccessRequest(Base):
    __tablename__ = "access_requests"

    id          = Column(Integer, primary_key=True, index=True)
    full_name   = Column(String, nullable=False)
    email       = Column(String, nullable=False)
    institute   = Column(String, nullable=False)
    code        = Column(String, nullable=False)
    plan        = Column(String, nullable=False, default="basic")
    seat_limit  = Column(Integer, nullable=False, default=100)
    message     = Column(Text, nullable=True)
    status      = Column(Enum(AccessRequestStatus), default=AccessRequestStatus.pending, nullable=False)
    admin_note  = Column(Text, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
