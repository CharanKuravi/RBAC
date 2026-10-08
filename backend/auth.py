import random
import string
import secrets
import os
from datetime import datetime, timedelta
from typing import Optional, List

from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
import models

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "exam-centre-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def generate_roll_number(db: Session) -> str:
    chars = string.ascii_uppercase + string.digits
    while True:
        roll = "".join(random.choices(chars, k=9))
        existing = db.query(models.User).filter(models.User.roll_number == roll).first()
        if not existing:
            return roll


def generate_session_token() -> str:
    return secrets.token_hex(32)


def get_permissions(user: models.User) -> List[str]:
    if user.role in models.FULL_ACCESS_ROLES:
        return models.AVAILABLE_PERMISSIONS
    if user.role == models.UserRole.staff and user.staff_profile:
        raw = user.staff_profile.permissions or ""
        return [p.strip() for p in raw.split(",") if p.strip()]
    return []


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        session_token: str = payload.get("session_token")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(
        models.User.id == int(user_id),
        models.User.is_deleted == False,
    ).first()
    if user is None or not user.is_active:
        raise credentials_exception

    # Single session enforcement for students
    if user.role == models.UserRole.student and session_token:
        if user.session_token != session_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired. Another login was detected.",
            )
    return user


def require_full_access(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role not in models.FULL_ACCESS_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


# Keep backward compat alias
require_admin = require_full_access


def require_admin_or_staff(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role not in (*models.FULL_ACCESS_ROLES, models.UserRole.staff):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return current_user


def require_permission(permission: str):
    def checker(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role in models.FULL_ACCESS_ROLES:
            return current_user
        perms = get_permissions(current_user)
        if permission not in perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission}",
            )
        return current_user
    return checker


def require_student(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != models.UserRole.student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
    return current_user


def log_audit(
    db: Session,
    actor: models.User,
    action: str,
    entity_type: str = None,
    entity_id: str = None,
    detail: str = None,
):
    """Helper to write an audit log entry."""
    entry = models.AuditLog(
        actor_id=actor.id if actor else None,
        actor_email=actor.email if actor else None,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        detail=detail,
    )
    db.add(entry)
    # Don't commit here — caller commits
