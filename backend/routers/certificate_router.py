"""
Phase 2: Hall Ticket, Certificate (PDF + QR), Rank, Attendance
"""
import io
import secrets
import string
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
import models
from auth import require_student, require_permission, get_current_user, log_audit

router = APIRouter(prefix="/certificates", tags=["certificates"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _gen_cert_id() -> str:
    chars = string.ascii_uppercase + string.digits
    return "CERT-" + "".join(secrets.choice(chars) for _ in range(10))


def _make_pdf_hall_ticket(student, test, paper, college) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm,
                            leftMargin=2*cm, rightMargin=2*cm)
    styles = getSampleStyleSheet()
    elements = []

    title_style = ParagraphStyle('title', parent=styles['Heading1'],
                                  fontSize=18, spaceAfter=6, alignment=1)
    sub_style = ParagraphStyle('sub', parent=styles['Normal'],
                                fontSize=10, spaceAfter=4, alignment=1, textColor=colors.grey)
    label_style = ParagraphStyle('label', parent=styles['Normal'], fontSize=9,
                                  textColor=colors.grey, spaceAfter=2)
    value_style = ParagraphStyle('value', parent=styles['Normal'], fontSize=11,
                                  fontName='Helvetica-Bold', spaceAfter=8)

    elements.append(Paragraph("HALL TICKET", title_style))
    elements.append(Paragraph(college.name if college else "Exam Centre", sub_style))
    elements.append(Paragraph("Online Examination Management System", sub_style))
    elements.append(Spacer(1, 0.5*cm))

    # Divider
    elements.append(Table([['']], colWidths=[17*cm],
                           style=TableStyle([('LINEBELOW', (0,0), (-1,-1), 1, colors.black)])))
    elements.append(Spacer(1, 0.4*cm))

    data = [
        ["Candidate Name", student.full_name or "N/A"],
        ["Candidate ID (CID)", student.roll_number or "N/A"],
        ["Email", student.email],
        ["Test Name", test.name if test else "N/A"],
        ["Test Code", test.code or "N/A" if test else "N/A"],
        ["Paper Set ID", str(paper.id)],
        ["Subject", paper.subject],
        ["Duration", f"{test.duration_minutes} minutes" if test else f"{paper.duration_minutes} minutes"],
        ["Scheduled Date", test.scheduled_date.strftime("%d %B %Y") if test and test.scheduled_date else "As scheduled"],
        ["Start Time", test.start_time.strftime("%I:%M %p") if test and test.start_time else "As scheduled"],
        ["Total Marks", str(paper.total_marks)],
        ["Pass Percentage", f"{paper.pass_percentage}%"],
    ]

    table = Table(data, colWidths=[6*cm, 11*cm])
    table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.Color(0.97, 0.97, 0.97)]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 0.5*cm))

    elements.append(Table([['']], colWidths=[17*cm],
                           style=TableStyle([('LINEBELOW', (0,0), (-1,-1), 0.5, colors.grey)])))
    elements.append(Spacer(1, 0.3*cm))

    note_style = ParagraphStyle('note', parent=styles['Normal'], fontSize=8,
                                 textColor=colors.grey, leading=12)
    elements.append(Paragraph(
        "Instructions: Carry this hall ticket to the examination. "
        "No electronic devices are permitted. "
        "All activity is monitored and recorded.",
        note_style
    ))

    doc.build(elements)
    return buf.getvalue()


def _make_pdf_certificate(student, submission, paper, test, cert, college) -> bytes:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    import qrcode

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4),
                            topMargin=2*cm, bottomMargin=2*cm,
                            leftMargin=3*cm, rightMargin=3*cm)
    styles = getSampleStyleSheet()
    elements = []

    # QR code
    qr = qrcode.QRCode(version=1, box_size=4, border=2)
    qr.add_data(f"CERT:{cert.cert_id}|CID:{student.roll_number}|SCORE:{submission.score}/{paper.total_marks}")
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    qr_buf = io.BytesIO()
    qr_img.save(qr_buf, format='PNG')
    qr_buf.seek(0)

    title_style = ParagraphStyle('title', parent=styles['Heading1'],
                                  fontSize=28, spaceAfter=4, alignment=1,
                                  fontName='Helvetica-Bold')
    sub_style = ParagraphStyle('sub', parent=styles['Normal'],
                                fontSize=12, spaceAfter=6, alignment=1,
                                textColor=colors.grey)
    body_style = ParagraphStyle('body', parent=styles['Normal'],
                                 fontSize=13, spaceAfter=8, alignment=1, leading=20)
    small_style = ParagraphStyle('small', parent=styles['Normal'],
                                  fontSize=9, textColor=colors.grey, alignment=1)

    elements.append(Spacer(1, 0.5*cm))
    elements.append(Paragraph("CERTIFICATE OF COMPLETION", title_style))
    elements.append(Paragraph(college.name if college else "Exam Centre", sub_style))
    elements.append(Paragraph("Online Examination Management System", sub_style))
    elements.append(Spacer(1, 0.8*cm))

    elements.append(Paragraph("This is to certify that", body_style))
    name_style = ParagraphStyle('name', parent=styles['Normal'],
                                 fontSize=22, spaceAfter=8, alignment=1,
                                 fontName='Helvetica-Bold')
    elements.append(Paragraph(student.full_name or student.email, name_style))
    elements.append(Paragraph(
        f"has successfully completed the examination in <b>{paper.subject}</b>",
        body_style
    ))
    elements.append(Paragraph(
        f"with a score of <b>{submission.score} / {paper.total_marks}</b> "
        f"({submission.percentage:.1f}%)",
        body_style
    ))
    if submission.rank:
        elements.append(Paragraph(f"Rank: <b>{submission.rank}</b>", body_style))

    elements.append(Spacer(1, 0.8*cm))

    # Bottom row: cert details + QR
    issued = cert.issued_at.strftime("%d %B %Y") if cert.issued_at else datetime.utcnow().strftime("%d %B %Y")
    detail_data = [
        [f"Certificate ID: {cert.cert_id}", Image(qr_buf, width=2.5*cm, height=2.5*cm)],
        [f"Candidate ID: {student.roll_number or 'N/A'}", ""],
        [f"Issued: {issued}", ""],
    ]
    detail_table = Table(detail_data, colWidths=[18*cm, 3*cm])
    detail_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.grey),
        ('SPAN', (1, 0), (1, 2)),
        ('VALIGN', (1, 0), (1, 2), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, 2), 'RIGHT'),
    ]))
    elements.append(detail_table)

    doc.build(elements)
    return buf.getvalue()


# ── Hall Ticket ────────────────────────────────────────────────────────────────

@router.get("/hall-ticket/{test_id}")
def download_hall_ticket(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    # Verify assigned
    from routers.exam_router import _get_student_test_ids
    if test_id not in _get_student_test_ids(db, current_user.id):
        raise HTTPException(status_code=403, detail="This test is not assigned to you")

    paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == test.paper_id).first()
    college = db.query(models.College).filter(models.College.id == current_user.college_id).first() if current_user.college_id else None

    pdf_bytes = _make_pdf_hall_ticket(current_user, test, paper, college)
    filename = f"hall_ticket_{current_user.roll_number}_{test_id}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Rank calculation ───────────────────────────────────────────────────────────

def _recalculate_ranks(db: Session, test_id: int):
    """Recalculate ranks for all submissions of a test, ordered by score desc."""
    subs = db.query(models.Submission).filter(
        models.Submission.test_id == test_id,
        models.Submission.score.isnot(None),
    ).order_by(models.Submission.score.desc()).all()

    rank = 1
    prev_score = None
    for i, s in enumerate(subs):
        if s.score != prev_score:
            rank = i + 1
        s.rank = rank
        prev_score = s.score
    db.commit()


# ── Certificate issuance ───────────────────────────────────────────────────────

@router.post("/issue/{submission_id}")
def issue_certificate(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_results")),
):
    """Admin issues a certificate for a passed submission."""
    submission = db.query(models.Submission).filter(models.Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if not submission.passed:
        raise HTTPException(status_code=400, detail="Cannot issue certificate for failed submission")

    existing = db.query(models.Certificate).filter(
        models.Certificate.submission_id == submission_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Certificate already issued")

    cert_id = _gen_cert_id()
    while db.query(models.Certificate).filter(models.Certificate.cert_id == cert_id).first():
        cert_id = _gen_cert_id()

    cert = models.Certificate(
        cert_id=cert_id,
        student_id=submission.student_id,
        submission_id=submission_id,
        test_id=submission.test_id,
        paper_id=submission.paper_id,
        is_approved=False,
    )
    db.add(cert)
    log_audit(db, current_user, "ISSUE_CERTIFICATE", "Certificate", cert_id,
              f"Issued for submission {submission_id}")
    db.commit()
    db.refresh(cert)
    return {"detail": "Certificate issued", "cert_id": cert_id, "id": cert.id}


@router.post("/{cert_id}/approve")
def approve_certificate(
    cert_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_results")),
):
    cert = db.query(models.Certificate).filter(models.Certificate.cert_id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    cert.is_approved = True
    cert.approved_at = datetime.utcnow()
    cert.approved_by_id = current_user.id
    log_audit(db, current_user, "APPROVE_CERTIFICATE", "Certificate", cert_id)
    db.commit()
    return {"detail": "Certificate approved", "cert_id": cert_id}


@router.get("/my-certificates")
def my_certificates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    certs = db.query(models.Certificate).filter(
        models.Certificate.student_id == current_user.id,
        models.Certificate.is_approved == True,
    ).all()
    result = []
    for c in certs:
        paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == c.paper_id).first()
        sub = db.query(models.Submission).filter(models.Submission.id == c.submission_id).first()
        result.append({
            "cert_id": c.cert_id,
            "paper_title": paper.title if paper else "--",
            "subject": paper.subject if paper else "--",
            "score": sub.score if sub else None,
            "total_marks": sub.total_marks if sub else None,
            "percentage": sub.percentage if sub else None,
            "rank": sub.rank if sub else None,
            "issued_at": c.issued_at,
        })
    return result


@router.get("/download/{cert_id}")
def download_certificate(
    cert_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cert = db.query(models.Certificate).filter(models.Certificate.cert_id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if not cert.is_approved:
        raise HTTPException(status_code=403, detail="Certificate not yet approved")
    # Students can only download their own
    if current_user.role == models.UserRole.student and cert.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    student = db.query(models.User).filter(models.User.id == cert.student_id).first()
    submission = db.query(models.Submission).filter(models.Submission.id == cert.submission_id).first()
    paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == cert.paper_id).first()
    test = db.query(models.Test).filter(models.Test.id == cert.test_id).first() if cert.test_id else None
    college = db.query(models.College).filter(models.College.id == student.college_id).first() if student.college_id else None

    pdf_bytes = _make_pdf_certificate(student, submission, paper, test, cert, college)
    filename = f"certificate_{cert_id}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Admin: list all certificates ───────────────────────────────────────────────

@router.get("/admin/all")
def list_all_certificates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_results")),
):
    certs = db.query(models.Certificate).order_by(models.Certificate.issued_at.desc()).all()
    result = []
    for c in certs:
        student = db.query(models.User).filter(models.User.id == c.student_id).first()
        paper = db.query(models.QuestionPaper).filter(models.QuestionPaper.id == c.paper_id).first()
        sub = db.query(models.Submission).filter(models.Submission.id == c.submission_id).first()
        result.append({
            "id": c.id,
            "cert_id": c.cert_id,
            "student_name": student.full_name if student else "--",
            "student_cid": student.roll_number if student else "--",
            "paper_title": paper.title if paper else "--",
            "score": sub.score if sub else None,
            "total_marks": sub.total_marks if sub else None,
            "rank": sub.rank if sub else None,
            "is_approved": c.is_approved,
            "issued_at": c.issued_at,
        })
    return result


# ── Attendance ─────────────────────────────────────────────────────────────────

@router.post("/attendance/mark/{test_id}")
def mark_attendance(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    """Called when student starts a test — marks attendance."""
    existing = db.query(models.Attendance).filter(
        models.Attendance.student_id == current_user.id,
        models.Attendance.test_id == test_id,
    ).first()
    if existing:
        return {"detail": "Attendance already marked", "status": existing.status}

    att = models.Attendance(
        student_id=current_user.id,
        test_id=test_id,
        status="present",
    )
    db.add(att)
    db.commit()
    return {"detail": "Attendance marked as present"}


@router.get("/attendance/test/{test_id}")
def test_attendance(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_results")),
):
    """Get attendance report for a test."""
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    # Get all assigned students
    assignments = db.query(models.TestAssignment).filter(
        models.TestAssignment.test_id == test_id
    ).all()

    # Expand batch/group assignments
    student_ids = set()
    for a in assignments:
        if a.student_id:
            student_ids.add(a.student_id)
        if a.batch_id:
            for bm in db.query(models.BatchMember).filter(models.BatchMember.batch_id == a.batch_id).all():
                student_ids.add(bm.student_id)
        if a.group_id:
            for gm in db.query(models.GroupMember).filter(models.GroupMember.group_id == a.group_id).all():
                student_ids.add(gm.student_id)

    attended = {a.student_id for a in db.query(models.Attendance).filter(
        models.Attendance.test_id == test_id
    ).all()}

    result = []
    for sid in student_ids:
        student = db.query(models.User).filter(models.User.id == sid).first()
        if student:
            result.append({
                "student_id": sid,
                "cid": student.roll_number,
                "name": student.full_name or student.email,
                "status": "present" if sid in attended else "absent",
            })

    present = sum(1 for r in result if r["status"] == "present")
    return {
        "test_id": test_id,
        "test_name": test.name,
        "total_assigned": len(result),
        "present": present,
        "absent": len(result) - present,
        "attendance_rate": round(present / len(result) * 100, 1) if result else 0,
        "records": result,
    }
