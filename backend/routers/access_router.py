from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas
from auth import require_admin, hash_password
from college_db import init_college_db

router = APIRouter(tags=["access"])


# ── Public: submit access request ─────────────────────────────────────────────

@router.post("/access-request", response_model=schemas.AccessRequestOut)
def submit_access_request(
    payload: schemas.AccessRequestCreate,
    db: Session = Depends(get_db),
):
    # Check if code already taken
    existing_college = db.query(models.College).filter(
        models.College.code == payload.code.upper()
    ).first()
    if existing_college:
        raise HTTPException(status_code=400, detail="This institute code is already registered.")

    # Check for duplicate pending request
    existing_req = db.query(models.AccessRequest).filter(
        models.AccessRequest.code == payload.code.upper(),
        models.AccessRequest.status == models.AccessRequestStatus.pending,
    ).first()
    if existing_req:
        raise HTTPException(status_code=400, detail="A pending request for this code already exists.")

    plan_limits = {"basic": 600, "limited": 1800, "standard": 3000, "premium": 5000}
    plan_max = plan_limits.get(payload.plan, 600)
    if payload.seat_limit < 100 or payload.seat_limit > plan_max:
        raise HTTPException(
            status_code=400,
            detail=f"Seat limit for {payload.plan} plan must be between 100 and {plan_max}."
        )

    req = models.AccessRequest(
        full_name=payload.full_name,
        email=payload.email,
        institute=payload.institute,
        code=payload.code.upper(),
        plan=payload.plan,
        seat_limit=payload.seat_limit,
        message=payload.message,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


# ── Admin: list all requests ───────────────────────────────────────────────────

@router.get("/admin/access-requests", response_model=List[schemas.AccessRequestOut])
def list_access_requests(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    return db.query(models.AccessRequest).order_by(
        models.AccessRequest.created_at.desc()
    ).all()


# ── Admin: review (approve/reject) ────────────────────────────────────────────

@router.patch("/admin/access-requests/{req_id}", response_model=schemas.AccessRequestOut)
def review_access_request(
    req_id: int,
    payload: schemas.AccessRequestReview,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    req = db.query(models.AccessRequest).filter(models.AccessRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != models.AccessRequestStatus.pending:
        raise HTTPException(status_code=400, detail="Request already reviewed")

    if payload.status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")

    req.status = payload.status
    req.admin_note = payload.admin_note
    req.reviewed_at = datetime.utcnow()

    if payload.status == "approved":
        # Check code not taken since request was submitted
        existing = db.query(models.College).filter(
            models.College.code == req.code
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="College code already registered.")

        # Create the college
        college = models.College(
            name=req.institute,
            code=req.code,
            plan=req.plan,
            seat_limit=req.seat_limit,
        )
        db.add(college)
        db.flush()

        # Initialize isolated DB for this college
        db_path = init_college_db(req.code)

        # Create admin user for the college in main DB
        admin_email = f"admin@{req.code.lower()}.examcentre"
        admin_password = f"{req.code}@Admin2025"

        existing_user = db.query(models.User).filter(models.User.email == admin_email).first()
        if not existing_user:
            admin_user = models.User(
                email=admin_email,
                hashed_password=hash_password(admin_password),
                role=models.UserRole.admin,
                college_id=college.id,
            )
            db.add(admin_user)

    db.commit()
    db.refresh(req)
    return req


@router.delete("/admin/access-requests/{req_id}")
def delete_access_request(
    req_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    req = db.query(models.AccessRequest).filter(models.AccessRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    db.delete(req)
    db.commit()
    return {"detail": "Request deleted"}
