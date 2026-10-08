from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import pandas as pd
import io

from database import get_db
import models
from auth import require_permission, require_student, get_current_user, log_audit, hash_password

router = APIRouter(prefix="/hackathons", tags=["hackathons"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class HackathonCreate(BaseModel):
    name: str
    description: Optional[str] = None
    paper_id: int
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    max_participants: Optional[int] = None
    pass_percentage: int = 40
    is_public: bool = True
    show_leaderboard: bool = True


class HackathonOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    paper_id: int
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    max_participants: Optional[int]
    participant_count: int
    pass_percentage: int
    is_public: bool
    show_leaderboard: bool
    status: str  # upcoming, active, completed
    
    class Config:
        from_attributes = True


# ── Admin: Create Hackathon ──────────────────────────────────────────────────

@router.post("", response_model=HackathonOut)
def create_hackathon(
    payload: HackathonCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_tests")),
):
    """Admin creates a hackathon event."""
    # Verify paper exists
    paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == payload.paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Determine initial status
    now = datetime.utcnow()
    if payload.start_time > now:
        status = "upcoming"
    elif payload.start_time <= now <= payload.end_time:
        status = "active"
    else:
        status = "completed"
    
    hackathon = models.Hackathon(
        name=payload.name,
        description=payload.description,
        paper_id=payload.paper_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration_minutes=payload.duration_minutes,
        max_participants=payload.max_participants,
        pass_percentage=payload.pass_percentage,
        is_public=payload.is_public,
        show_leaderboard=payload.show_leaderboard,
        status=status,
        created_by_id=current_user.id,
    )
    
    db.add(hackathon)
    db.commit()
    db.refresh(hackathon)
    
    log_audit(db, current_user, "CREATE_HACKATHON", "Hackathon", hackathon.id, payload.name)
    
    # Add participant count
    count = db.query(models.HackathonParticipant).filter(
        models.HackathonParticipant.hackathon_id == hackathon.id
    ).count()
    
    # Return as dict with participant_count
    result = {
        "id": hackathon.id,
        "name": hackathon.name,
        "description": hackathon.description,
        "paper_id": hackathon.paper_id,
        "start_time": hackathon.start_time,
        "end_time": hackathon.end_time,
        "duration_minutes": hackathon.duration_minutes,
        "max_participants": hackathon.max_participants,
        "pass_percentage": hackathon.pass_percentage,
        "is_public": hackathon.is_public,
        "show_leaderboard": hackathon.show_leaderboard,
        "status": hackathon.status,
        "participant_count": count,
    }
    return result


# ── Admin: List All Hackathons ───────────────────────────────────────────────

@router.get("", response_model=List[HackathonOut])
def list_hackathons(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_tests")),
):
    """Admin views all hackathons."""
    hackathons = db.query(models.Hackathon).order_by(models.Hackathon.start_time.desc()).all()
    
    result = []
    for h in hackathons:
        count = db.query(models.HackathonParticipant).filter(
            models.HackathonParticipant.hackathon_id == h.id
        ).count()
        
        # Convert to dict and add participant_count
        out_dict = {
            "id": h.id,
            "name": h.name,
            "description": h.description,
            "paper_id": h.paper_id,
            "start_time": h.start_time,
            "end_time": h.end_time,
            "duration_minutes": h.duration_minutes,
            "max_participants": h.max_participants,
            "pass_percentage": h.pass_percentage,
            "is_public": h.is_public,
            "show_leaderboard": h.show_leaderboard,
            "status": h.status,
            "participant_count": count,
        }
        result.append(out_dict)
    
    return result


# ── Admin: Bulk Upload Participants ──────────────────────────────────────────

@router.post("/bulk-upload-participants")
def bulk_upload_participants(
    file: UploadFile = File(...),
    hackathon_id: int = Form(...),
    default_password: str = Form("Hackathon@2024"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_tests")),
):
    """Admin uploads participants via CSV/Excel."""
    hackathon = db.query(models.Hackathon).filter(models.Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    try:
        contents = file.file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        created = 0
        skipped = 0
        
        for _, row in df.iterrows():
            try:
                full_name = str(row.get('full_name', '')).strip()
                email = str(row.get('email', '')).strip().lower()
                phone = str(row.get('phone', '')).strip() if 'phone' in row else None
                college_name = str(row.get('college_name', '')).strip() if 'college_name' in row else None
                
                if not full_name or not email:
                    skipped += 1
                    continue
                
                # Check if user already exists
                user = db.query(models.User).filter(models.User.email == email).first()
                
                if not user:
                    # Create new user (student role)
                    import random
                    import string
                    roll_number = ''.join(random.choices(string.ascii_uppercase + string.digits, k=9))
                    
                    user = models.User(
                        email=email,
                        hashed_password=hash_password(default_password),
                        role="student",
                        full_name=full_name,
                        phone=phone,
                        roll_number=roll_number,
                    )
                    db.add(user)
                    db.flush()
                
                # Register for hackathon
                existing = db.query(models.HackathonParticipant).filter(
                    models.HackathonParticipant.hackathon_id == hackathon_id,
                    models.HackathonParticipant.student_id == user.id,
                ).first()
                
                if not existing:
                    participant = models.HackathonParticipant(
                        hackathon_id=hackathon_id,
                        student_id=user.id,
                        college_name=college_name,
                        registered_at=datetime.utcnow(),
                    )
                    db.add(participant)
                    created += 1
                else:
                    skipped += 1
                    
            except Exception:
                skipped += 1
                continue
        
        db.commit()
        
        log_audit(db, current_user, "BULK_UPLOAD_PARTICIPANTS", "Hackathon", hackathon_id, 
                  f"Uploaded {created} participants")
        
        return {"created": created, "skipped": skipped}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")
    finally:
        file.file.close()


# ── Admin: Get Participants ──────────────────────────────────────────────────

@router.get("/{hackathon_id}/participants")
def get_participants(
    hackathon_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_tests")),
):
    """Admin views all participants of a hackathon."""
    participants = db.query(
        models.HackathonParticipant,
        models.User,
    ).join(
        models.User, models.HackathonParticipant.student_id == models.User.id
    ).filter(
        models.HackathonParticipant.hackathon_id == hackathon_id
    ).all()
    
    result = []
    for p, u in participants:
        # Check if submitted
        submission = db.query(models.Submission).filter(
            models.Submission.student_id == u.id,
            models.Submission.hackathon_id == hackathon_id,
        ).first()
        
        result.append({
            "full_name": u.full_name,
            "email": u.email,
            "roll_number": u.roll_number,
            "college_name": p.college_name,
            "registered_at": p.registered_at,
            "submitted": submission is not None,
        })
    
    return result


# ── Admin: Get Leaderboard ───────────────────────────────────────────────────

@router.get("/{hackathon_id}/leaderboard")
def get_leaderboard(
    hackathon_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),  # Any authenticated user can view
):
    """Get hackathon leaderboard (public if show_leaderboard is true)."""
    hackathon = db.query(models.Hackathon).filter(models.Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Get all submissions for this hackathon, ordered by score and submission time
    submissions = db.query(
        models.Submission,
        models.User,
        models.HackathonParticipant.college_name,
    ).join(
        models.User, models.Submission.student_id == models.User.id
    ).outerjoin(
        models.HackathonParticipant,
        (models.HackathonParticipant.student_id == models.User.id) &
        (models.HackathonParticipant.hackathon_id == hackathon_id)
    ).filter(
        models.Submission.hackathon_id == hackathon_id
    ).order_by(
        models.Submission.score.desc(),
        models.Submission.submitted_at.asc()
    ).all()
    
    result = []
    for idx, (sub, user, college) in enumerate(submissions, 1):
        # Calculate time taken
        time_taken = None
        if sub.submitted_at and sub.created_at:
            delta = sub.submitted_at - sub.created_at
            minutes = int(delta.total_seconds() / 60)
            time_taken = f"{minutes} min"
        
        result.append({
            "rank": idx,
            "student_name": user.full_name,
            "roll_number": user.roll_number,
            "college_name": college,
            "score": sub.score,
            "total_marks": sub.total_marks,
            "time_taken": time_taken,
            "submitted_at": sub.submitted_at,
        })
    
    return result


# ── Student: Get Available Hackathons ────────────────────────────────────────

@router.get("/available", response_model=List[HackathonOut])
def get_available_hackathons(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    """Student views all public hackathons they haven't registered for."""
    now = datetime.utcnow()
    
    # Get hackathons that are public and not completed
    hackathons = db.query(models.Hackathon).filter(
        models.Hackathon.is_public == True,
        models.Hackathon.end_time > now,
    ).order_by(models.Hackathon.start_time).all()
    
    result = []
    for h in hackathons:
        # Check if already registered
        registered = db.query(models.HackathonParticipant).filter(
            models.HackathonParticipant.hackathon_id == h.id,
            models.HackathonParticipant.student_id == current_user.id,
        ).first()
        
        if not registered:
            count = db.query(models.HackathonParticipant).filter(
                models.HackathonParticipant.hackathon_id == h.id
            ).count()
            
            out_dict = {
                "id": h.id,
                "name": h.name,
                "description": h.description,
                "paper_id": h.paper_id,
                "start_time": h.start_time,
                "end_time": h.end_time,
                "duration_minutes": h.duration_minutes,
                "max_participants": h.max_participants,
                "pass_percentage": h.pass_percentage,
                "is_public": h.is_public,
                "show_leaderboard": h.show_leaderboard,
                "status": h.status,
                "participant_count": count,
            }
            result.append(out_dict)
    
    return result


# ── Student: Register for Hackathon ──────────────────────────────────────────

@router.post("/{hackathon_id}/register")
def register_for_hackathon(
    hackathon_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    """Student registers for a hackathon."""
    hackathon = db.query(models.Hackathon).filter(models.Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    if not hackathon.is_public:
        raise HTTPException(status_code=403, detail="This hackathon is not open for public registration")
    
    now = datetime.utcnow()
    if hackathon.end_time < now:
        raise HTTPException(status_code=400, detail="This hackathon has ended")
    
    # Check if already registered
    existing = db.query(models.HackathonParticipant).filter(
        models.HackathonParticipant.hackathon_id == hackathon_id,
        models.HackathonParticipant.student_id == current_user.id,
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already registered")
    
    # Check max participants
    if hackathon.max_participants:
        count = db.query(models.HackathonParticipant).filter(
            models.HackathonParticipant.hackathon_id == hackathon_id
        ).count()
        if count >= hackathon.max_participants:
            raise HTTPException(status_code=400, detail="Hackathon is full")
    
    participant = models.HackathonParticipant(
        hackathon_id=hackathon_id,
        student_id=current_user.id,
        registered_at=datetime.utcnow(),
    )
    db.add(participant)
    db.commit()
    
    return {"detail": "Successfully registered"}


# ── Student: Get My Hackathons ───────────────────────────────────────────────

@router.get("/my-hackathons")
def get_my_hackathons(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    """Student views hackathons they've registered for."""
    participants = db.query(
        models.HackathonParticipant,
        models.Hackathon,
    ).join(
        models.Hackathon, models.HackathonParticipant.hackathon_id == models.Hackathon.id
    ).filter(
        models.HackathonParticipant.student_id == current_user.id
    ).order_by(models.Hackathon.start_time.desc()).all()
    
    result = []
    for p, h in participants:
        # Check if submitted
        submission = db.query(models.Submission).filter(
            models.Submission.student_id == current_user.id,
            models.Submission.hackathon_id == h.id,
        ).first()
        
        # Get rank if submitted
        rank = None
        if submission:
            better_scores = db.query(models.Submission).filter(
                models.Submission.hackathon_id == h.id,
                models.Submission.score > submission.score,
            ).count()
            rank = better_scores + 1
        
        count = db.query(models.HackathonParticipant).filter(
            models.HackathonParticipant.hackathon_id == h.id
        ).count()
        
        out = HackathonOut.model_validate(h).model_dump()
        out['participant_count'] = count
        out['submitted'] = submission is not None
        out['submission_id'] = submission.id if submission else None
        out['score'] = submission.score if submission else None
        out['total_marks'] = submission.total_marks if submission else None
        out['rank'] = rank
        
        result.append(out)
    
    return result
