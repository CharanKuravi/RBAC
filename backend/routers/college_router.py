import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas
from auth import require_admin, hash_password, generate_roll_number
from college_db import init_college_db

router = APIRouter(prefix="/admin/colleges", tags=["colleges"])

PLAN_LIMITS = models.PLAN_LIMITS
PLAN_MIN = models.PLAN_MIN


def _college_out(college: models.College, db: Session) -> schemas.CollegeOut:
    count = db.query(models.User).filter(
        models.User.college_id == college.id,
        models.User.role == models.UserRole.student,
    ).count()
    return schemas.CollegeOut(
        id=college.id,
        name=college.name,
        code=college.code,
        plan=college.plan,
        seat_limit=college.seat_limit,
        is_active=college.is_active,
        created_at=college.created_at,
        students_count=count,
        seats_remaining=max(0, college.seat_limit - count),
    )


def _parse_roll(roll: str):
    """
    Parse a roll number into (prefix, numeric_part, padding_length).
    Accepts any format: 242UA05114, CS2024001, 001, etc.
    Finds the LAST contiguous digit sequence as the numeric part.
    """
    roll = roll.strip().upper()
    # Find last numeric block
    m = re.search(r'^(.*?)(\d+)$', roll)
    if not m:
        raise HTTPException(
            status_code=400,
            detail=f"Roll number '{roll}' must contain at least one digit."
        )
    prefix = m.group(1)
    num_str = m.group(2)
    return prefix, int(num_str), len(num_str)


def _check_quota(college: models.College, adding: int, db: Session):
    current = db.query(models.User).filter(
        models.User.college_id == college.id,
        models.User.role == models.UserRole.student,
    ).count()
    remaining = college.seat_limit - current
    if adding > remaining:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Plan limit exceeded. "
                f"College '{college.name}' ({college.plan} plan) has {college.seat_limit} seats total, "
                f"{current} already used, {remaining} remaining. "
                f"You are trying to add {adding} students."
            )
        )


# ── College CRUD ───────────────────────────────────────────────────────────────

@router.get("", response_model=List[schemas.CollegeOut])
def list_colleges(db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    colleges = db.query(models.College).all()
    return [_college_out(c, db) for c in colleges]


@router.post("", response_model=schemas.CollegeOut)
def create_college(
    payload: schemas.CollegeCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    existing = db.query(models.College).filter(models.College.code == payload.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="College code already exists")

    plan_max = PLAN_LIMITS[models.CollegePlan(payload.plan)]
    if payload.seat_limit < PLAN_MIN or payload.seat_limit > plan_max:
        raise HTTPException(
            status_code=400,
            detail=f"Seat limit for {payload.plan} plan must be between {PLAN_MIN} and {plan_max}"
        )

    college = models.College(
        name=payload.name,
        code=payload.code.upper(),
        plan=payload.plan,
        seat_limit=payload.seat_limit,
        subscription_type=payload.subscription_type,
        valid_until=payload.valid_until,
    )
    db.add(college)
    db.commit()
    db.refresh(college)

    # Initialize isolated DB for this college
    init_college_db(college.code)

    return _college_out(college, db)


@router.patch("/{college_id}", response_model=schemas.CollegeOut)
def update_college(
    college_id: int,
    payload: schemas.CollegeUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    college = db.query(models.College).filter(models.College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    if payload.name is not None:
        college.name = payload.name
    if payload.plan is not None:
        college.plan = payload.plan
    if payload.seat_limit is not None:
        plan = models.CollegePlan(payload.plan or college.plan)
        plan_max = PLAN_LIMITS[plan]
        if payload.seat_limit < PLAN_MIN or payload.seat_limit > plan_max:
            raise HTTPException(
                status_code=400,
                detail=f"Seat limit must be between {PLAN_MIN} and {plan_max}"
            )
        college.seat_limit = payload.seat_limit
    if payload.is_active is not None:
        college.is_active = payload.is_active

    db.commit()
    db.refresh(college)
    return _college_out(college, db)


@router.delete("/{college_id}")
def delete_college(
    college_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    college = db.query(models.College).filter(models.College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    db.delete(college)
    db.commit()
    return {"detail": "College deleted"}


# ── Roll Range Preview ─────────────────────────────────────────────────────────

@router.post("/{college_id}/preview-roll-range")
def preview_roll_range(
    college_id: int,
    payload: schemas.BatchAddByRollRange,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """Returns count and validation info without creating any students."""
    college = db.query(models.College).filter(models.College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    start = payload.roll_start.strip().upper()
    end = payload.roll_end.strip().upper()

    prefix_s, n_start, pad_s = _parse_roll(start)
    prefix_e, n_end, pad_e = _parse_roll(end)

    if prefix_s != prefix_e:
        raise HTTPException(status_code=400, detail="Both roll numbers must have the same prefix (e.g. both start with 242UA)")

    if n_end < n_start:
        raise HTTPException(status_code=400, detail="End roll number must be greater than or equal to start roll number")

    if n_end == n_start:
        raise HTTPException(status_code=400, detail="Start and end roll numbers are the same — range must have at least 2 students")

    count = n_end - n_start + 1

    current = db.query(models.User).filter(
        models.User.college_id == college.id,
        models.User.role == models.UserRole.student,
    ).count()
    remaining = college.seat_limit - current

    status = "ok"
    message = f"{count} students will be added ({start} to {end})"

    if count > remaining:
        status = "exceeded"
        message = (
            f"Plan limit exceeded. Trying to add {count} students but only {remaining} seats remaining "
            f"({college.seat_limit} total, {current} used). "
            f"Upgrade to a higher plan or reduce the range."
        )
    elif count == remaining:
        status = "exact"
        message = f"{count} students will be added. This will fill all remaining seats exactly."

    return {
        "roll_start": start,
        "roll_end": end,
        "prefix": prefix_s,
        "count": count,
        "seats_used": current,
        "seat_limit": college.seat_limit,
        "seats_remaining": remaining,
        "status": status,
        "message": message,
    }


# ── Batch Add by Count ─────────────────────────────────────────────────────────

@router.post("/{college_id}/batch-by-count", response_model=schemas.BatchAddResult)
def batch_add_by_count(
    college_id: int,
    payload: schemas.BatchAddByCount,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    college = db.query(models.College).filter(models.College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    _check_quota(college, payload.count, db)

    created = []
    skipped = 0
    domain = payload.email_domain.lstrip("@")

    for i in range(1, payload.count + 1):
        email = f"student{i}@{domain}"
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            skipped += 1
            continue

        roll = generate_roll_number(db)
        user = models.User(
            email=email,
            hashed_password=hash_password(payload.default_password),
            role=models.UserRole.student,
            roll_number=roll,
            college_id=college_id,
        )
        db.add(user)
        db.flush()
        created.append({"email": email, "roll_number": roll})

    db.commit()
    return schemas.BatchAddResult(
        created=len(created),
        skipped=skipped,
        message=f"{len(created)} students created, {skipped} skipped (already exist).",
        students=created,
    )


# ── Batch Add by Roll Range ────────────────────────────────────────────────────

@router.post("/{college_id}/batch-by-roll", response_model=schemas.BatchAddResult)
def batch_add_by_roll_range(
    college_id: int,
    payload: schemas.BatchAddByRollRange,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    college = db.query(models.College).filter(models.College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    start = payload.roll_start.strip().upper()
    end = payload.roll_end.strip().upper()

    prefix_s, n_start, pad_s = _parse_roll(start)
    prefix_e, n_end, pad_e = _parse_roll(end)

    if prefix_s != prefix_e:
        raise HTTPException(status_code=400, detail="Both roll numbers must have the same prefix")

    if n_end < n_start:
        raise HTTPException(status_code=400, detail="End roll number must be >= start roll number")

    count = n_end - n_start + 1
    if count > 5000:
        raise HTTPException(status_code=400, detail="Cannot add more than 5000 students at once")

    _check_quota(college, count, db)

    domain = payload.email_domain.lstrip("@")
    created = []
    skipped = 0

    for n in range(n_start, n_end + 1):
        roll = f"{prefix_s}{str(n).zfill(pad_s)}"
        email = f"{roll.lower()}@{domain}"

        existing_roll = db.query(models.User).filter(models.User.roll_number == roll).first()
        existing_email = db.query(models.User).filter(models.User.email == email).first()

        if existing_roll or existing_email:
            skipped += 1
            continue

        user = models.User(
            email=email,
            hashed_password=hash_password(payload.default_password),
            role=models.UserRole.student,
            roll_number=roll,
            college_id=college_id,
        )
        db.add(user)
        db.flush()
        created.append({"email": email, "roll_number": roll})

    db.commit()
    return schemas.BatchAddResult(
        created=len(created),
        skipped=skipped,
        message=f"{len(created)} students created from {start} to {end}, {skipped} skipped.",
        students=created,
    )


@router.get("/{college_id}/quota")
def get_college_quota(
    college_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    college = db.query(models.College).filter(models.College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    count = db.query(models.User).filter(
        models.User.college_id == college_id,
        models.User.role == models.UserRole.student,
    ).count()
    return {
        "college_id": college_id,
        "college_name": college.name,
        "plan": college.plan,
        "seat_limit": college.seat_limit,
        "students_enrolled": count,
        "seats_remaining": max(0, college.seat_limit - count),
        "plan_max": PLAN_LIMITS[college.plan],
    }
