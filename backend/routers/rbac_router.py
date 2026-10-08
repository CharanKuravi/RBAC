from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas
from auth import require_admin, hash_password

router = APIRouter(prefix="/admin/rbac", tags=["rbac"])

VALID_PERMISSIONS = set(models.AVAILABLE_PERMISSIONS)


def _parse_permissions(perms: List[str]) -> str:
    invalid = [p for p in perms if p not in VALID_PERMISSIONS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid permissions: {invalid}")
    return ",".join(perms)


@router.get("/permissions")
def list_available_permissions(_: models.User = Depends(require_admin)):
    """Return all available permission keys with labels."""
    labels = {
        "manage_students":     "Manage Students / Candidates",
        "manage_papers":       "Manage Question Papers",
        "manage_assignments":  "Manage Assignments",
        "view_submissions":    "View Submissions",
        "view_malpractice":    "View Malpractice Logs",
        "manage_courses":      "Manage Courses",
        "manage_batches":      "Manage Batches",
        "manage_groups":       "Manage Groups",
        "manage_tests":        "Manage Tests",
        "manage_question_bank":"Manage Question Bank",
        "view_results":        "View Results & Certificates",
        "manage_grievances":   "Manage Grievances",
        "view_audit_log":      "View Audit Log",
    }
    return [{"key": k, "label": labels.get(k, k)} for k in models.AVAILABLE_PERMISSIONS]


@router.get("/staff", response_model=List[schemas.UserOut])
def list_staff(db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    return db.query(models.User).filter(models.User.role == models.UserRole.staff).all()


@router.post("/staff", response_model=schemas.UserOut)
def create_staff(
    payload: schemas.StaffCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    perm_str = _parse_permissions(payload.permissions)

    user = models.User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=models.UserRole.staff,
        roll_number=None,
    )
    db.add(user)
    db.flush()

    user.full_name = payload.full_name  # stored on User, not StaffProfile
    profile = models.StaffProfile(
        user_id=user.id,
        designation=payload.designation,
        permissions=perm_str,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/staff/{user_id}", response_model=schemas.UserOut)
def update_staff(
    user_id: int,
    payload: schemas.StaffUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.role == models.UserRole.staff,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found")

    if payload.is_active is not None:
        user.is_active = payload.is_active

    if payload.full_name is not None:
        user.full_name = payload.full_name  # stored on User

    profile = user.staff_profile
    if profile:
        if payload.designation is not None:
            profile.designation = payload.designation
        if payload.permissions is not None:
            profile.permissions = _parse_permissions(payload.permissions)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/staff/{user_id}")
def delete_staff(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.role == models.UserRole.staff,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found")
    db.delete(user)
    db.commit()
    return {"detail": "Staff member deleted"}
