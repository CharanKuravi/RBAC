from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine
import models
from routers import (
    auth_router, admin_router, exam_router, rbac_router,
    lookup_router, college_router, ai_router, access_router,
    course_router, batch_router, group_router,
    question_bank_router, test_router,
    grievance_router, feedback_router, audit_router,
    roles_router, registration_router, certificate_router,
)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Exam Centre", version="2.0.0", docs_url="/api/docs", redoc_url="/api/redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Core ───────────────────────────────────────────────────────────────────────
app.include_router(auth_router.router,         prefix="/api")
app.include_router(admin_router.router,        prefix="/api")
app.include_router(rbac_router.router,         prefix="/api")
app.include_router(access_router.router,       prefix="/api")

# ── Academic structure ─────────────────────────────────────────────────────────
app.include_router(college_router.router,      prefix="/api")
app.include_router(course_router.router,       prefix="/api")
app.include_router(batch_router.router,        prefix="/api")
app.include_router(group_router.router,        prefix="/api")

# ── Exam content ───────────────────────────────────────────────────────────────
app.include_router(question_bank_router.router,prefix="/api")
app.include_router(test_router.router,         prefix="/api")
app.include_router(exam_router.router,         prefix="/api")

# ── Tools ──────────────────────────────────────────────────────────────────────
app.include_router(lookup_router.router,       prefix="/api")
app.include_router(ai_router.router,           prefix="/api")

# ── Student features ───────────────────────────────────────────────────────────
app.include_router(grievance_router.router,    prefix="/api")
app.include_router(feedback_router.router,     prefix="/api")

# ── Admin tools ────────────────────────────────────────────────────────────────
app.include_router(audit_router.router,        prefix="/api")
app.include_router(roles_router.router,        prefix="/api")
app.include_router(registration_router.router, prefix="/api")
app.include_router(certificate_router.router,  prefix="/api")

app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="frontend")
