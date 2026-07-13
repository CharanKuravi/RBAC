from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import (
    verify_password, create_access_token, get_permissions,
    generate_session_token, get_current_user
)

router = APIRouter(prefix="/auth", tags=["auth"])


from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # Support login by email OR username
    user = None
    if payload.email:
        user = db.query(models.User).filter(
            models.User.email == payload.email,
            models.User.is_deleted == False,
        ).first()
    elif payload.username:
        user = db.query(models.User).filter(
            models.User.username == payload.username,
            models.User.is_deleted == False,
        ).first()
    else:
        raise HTTPException(status_code=400, detail="Provide email or username")
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    if user.role == models.UserRole.student and not user.is_approved:
        raise HTTPException(status_code=403, detail="Account pending admin approval")

    # Check college subscription validity
    if user.college_id:
        from datetime import datetime as dt
        college = db.query(models.College).filter(models.College.id == user.college_id).first()
        if college and college.valid_until and college.valid_until < dt.utcnow().replace(tzinfo=college.valid_until.tzinfo):
            raise HTTPException(status_code=403, detail="Institution subscription has expired")

    # Generate session token for single-session enforcement (students)
    session_tok = generate_session_token()
    if user.role == models.UserRole.student:
        user.session_token = session_tok

    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "session_token": session_tok,
    })

    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        roll_number=user.roll_number,
        permissions=get_permissions(user),
    )


@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "roll_number": current_user.roll_number,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "college_id": current_user.college_id,
        "is_active": current_user.is_active,
        "permissions": get_permissions(current_user),
    }
