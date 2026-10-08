"""
Roles Management — CRUD for Admin, IT Coordinator, and Exam Setter accounts.
Only Super Admin can manage these roles.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

from database import get_db
import models
from auth import require_full_access, hash_password, log_audit

router = APIRouter(prefix="/admin/roles", tags=["roles"])

# Role definitions
MANAGEABLE_ROLES = {
    "super_admin": models.UserRole.super_admin,
    "admin": models.UserRole.admin,
    "it_coordinator": models.UserRole.it_coordinator,
    "exam_setter": models.UserRole.staff,
}

EXAM_SETTER_PERMISSIONS = "manage_papers,manage_question_bank,manage_tests"


class RoleUserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    designation: Optional[str] = None
    role_type: str  # admin | it_coordinator | exam_setter


class RoleUserUpdate(BaseModel):
    full_name: Optional[str] = None
    designation: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class RoleUserOut(BaseModel):
    id: int
    email: str
    role: str
    full_name: Optional[str]
    designation: Optional[str]
    is_active: bool
    created_at: datetime
    role_type: str

    class Config:
        from_attributes = True


def _get_role_users(db: Session, role_type: str):
    if role_type == "super_admin":
        return db.query(models.User).filter(
            models.User.role == models.UserRole.super_admin,
            models.User.is_deleted == False,
        ).all()
    elif role_type == "admin":
        return db.query(models.User).filter(
            models.User.role == models.UserRole.admin,
            models.User.is_deleted == False,
        ).all()
    elif role_type == "it_coordinator":
        return db.query(models.User).filter(
            models.User.role == models.UserRole.it_coordinator,
            models.User.is_deleted == False,
        ).all()
    elif role_type == "exam_setter":
        # Staff with exam setter permissions
        staff = db.query(models.User).filter(
            models.User.role == models.UserRole.staff,
            models.User.is_deleted == False,
        ).all()
        return [s for s in staff if s.staff_profile and
                any(p in (s.staff_profile.permissions or "") for p in ["manage_papers", "manage_tests"])]
    return []


def _format_user(user: models.User, role_type: str) -> dict:
    profile = user.staff_profile
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,  # always from User, not StaffProfile
        "designation": profile.designation if profile else None,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "role_type": role_type,
    }


@router.get("/{role_type}")
def list_role_users(
    role_type: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_full_access),
):
    if role_type not in MANAGEABLE_ROLES and role_type != "exam_setter":
        raise HTTPException(status_code=400, detail=f"Invalid role type: {role_type}")
    users = _get_role_users(db, role_type)
    return [_format_user(u, role_type) for u in users]


@router.post("/{role_type}")
def create_role_user(
    role_type: str,
    payload: RoleUserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_full_access),
):
    if role_type not in ("super_admin", "admin", "it_coordinator", "exam_setter"):
        raise HTTPException(status_code=400, detail="Invalid role type")

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if role_type == "super_admin":
        user_role = models.UserRole.super_admin
    elif role_type == "admin":
        user_role = models.UserRole.admin
    elif role_type == "it_coordinator":
        user_role = models.UserRole.it_coordinator
    else:
        user_role = models.UserRole.staff

    user = models.User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=user_role,
        full_name=payload.full_name,
    )
    db.add(user)
    db.flush()

    # For exam setter and staff roles, create a staff profile with permissions
    if role_type == "exam_setter":
        profile = models.StaffProfile(
            user_id=user.id,
            designation=payload.designation or "Exam Setter",
            permissions=EXAM_SETTER_PERMISSIONS,
        )
        db.add(profile)
    elif role_type in ("super_admin", "admin", "it_coordinator"):
        # Create staff profile for designation storage
        profile = models.StaffProfile(
            user_id=user.id,
            designation=payload.designation or role_type.replace("_", " ").title(),
            permissions="",
        )
        db.add(profile)

    log_audit(db, current_user, f"CREATE_{role_type.upper()}", "User", user.id, f"Created {role_type}: {payload.email}")
    db.commit()
    db.refresh(user)
    return _format_user(user, role_type)


@router.patch("/{role_type}/{user_id}")
def update_role_user(
    role_type: str,
    user_id: int,
    payload: RoleUserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_full_access),
):
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.is_deleted == False,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password:
        user.hashed_password = hash_password(payload.password)
    if payload.full_name:
        user.full_name = payload.full_name
    if payload.designation and user.staff_profile:
        user.staff_profile.designation = payload.designation

    log_audit(db, current_user, f"UPDATE_{role_type.upper()}", "User", user_id)
    db.commit()
    db.refresh(user)
    return _format_user(user, role_type)


@router.delete("/{role_type}/{user_id}")
def delete_role_user(
    role_type: str,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_full_access),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_deleted = True
    user.is_active = False
    log_audit(db, current_user, f"DELETE_{role_type.upper()}", "User", user_id, f"Deleted {user.email}")
    db.commit()
    return {"detail": f"{role_type.replace('_', ' ').title()} account deleted"}
