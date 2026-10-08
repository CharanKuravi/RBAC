# Exam Centre — Feature Sheet

> Complete reference of all features built in the system.  
> Stack: FastAPI · SQLite · React · Vite

---

## 1. Authentication & Sessions

| Feature | How it works |
|---|---|
| Login | Email + password. Returns a JWT token stored in the browser. |
| Single session | Only one active login per student at a time. Second login kicks the first. |
| Role-based redirect | Admin/staff → Admin panel. Student → Dashboard. Wrong role → redirected to login. |
| URL protection | Typing `/admin` in the browser without proper role redirects to login. |
| Auto logout | Token expires after 8 hours. |
| Candidate approval gate | New candidates cannot log in until an admin approves their account. |

---

## 2. Roles & Permissions

| Role | What they can do |
|---|---|
| Super Admin | Everything. No restrictions. |
| IT Coordinator | Same as Super Admin. |
| Admin | Full access to all modules. |
| Staff / Employee | Only the modules an admin explicitly grants them. |
| Candidate / Student | Only their own exam, results, grievances, and feedback. |

### Staff Permission Toggles

- Manage Students
- Manage Papers
- Manage Assignments
- View Submissions
- View Malpractice
- Manage Courses
- Manage Batches
- Manage Groups
- Manage Tests
- Manage Question Bank
- View Results
- Manage Grievances
- View Audit Log

---

## 3. Candidate Management

| Feature | How it works |
|---|---|
| Add candidate | Admin creates account. System auto-generates a 9-character alphanumeric CID (Candidate ID). |
| One course per candidate | Each candidate is assigned to exactly one course at a time. |
| Approval workflow | New candidates start as Pending. Admin approves or rejects. Bulk approve/reject with select-all checkbox. |
| Edit candidate | Admin can update name, email, phone, and course assignment. |
| Soft delete (Trash) | Deleting a candidate moves them to Trash — not permanently removed. |
| Restore from Trash | Admin can restore a trashed candidate back to active. |
| Permanent delete | Only possible from the Trash section. |
| Filter by status | View All / Pending Approval / Approved tabs in the Candidates section. |
| Batch add by count | Add N students at once with auto-generated emails and CIDs. |
| Batch add by roll range | Enter start roll (e.g. `242UA05100`) to end roll (e.g. `242UA05500`) — system generates all students in that range with a live preview of count and quota check before submitting. |

---

## 4. College / Customer Management

| Feature | How it works |
|---|---|
| College registry | Each college has a name, unique code, plan, and seat limit. |
| Subscription plans | Basic (100–600 seats), Limited (100–1800), Standard (100–3000), Premium (up to 5000). |
| Seat quota enforcement | Cannot add more students than the college's seat limit. |
| Quota panel | Right-side panel shows seats used, remaining, and a progress bar. |
| Access request | Colleges submit an onboarding request from the public page. Admin approves or rejects. On approval, college account and admin credentials are auto-created. |
| Per-college isolated DB | Each college gets its own separate SQLite database file. |

---

## 5. Academic Structure

| Feature | How it works |
|---|---|
| Courses | Create courses with name, code, description. Edit and archive. One candidate = one course. |
| Batches | Group candidates by time window. Link to a course. Set start/end dates. Edit, archive. |
| Assign students to batch | Multi-select students and add them to a batch. Remove individually. |
| Groups | Sub-classification within or across batches. Create, edit, archive. |
| Assign students to group | Same multi-select flow as batches. |

---

## 6. Question Bank

| Feature | How it works |
|---|---|
| Central repository | All questions live here. No duplication — papers reference questions by ID only. |
| Unique Question ID | Every question has a permanent numeric ID. Can be reused across multiple papers. |
| Question properties | Text, 4 options (A/B/C/D), correct answer, subject, topic, difficulty (Easy / Medium / Hard), marks. |
| Search and filter | Filter by subject, topic, difficulty, or keyword. |
| Edit with versioning | Editing a question creates a new version. Old version is archived. Past test integrity preserved. |
| Archive | Soft-removes from active bank. Never hard deleted. |
| Add to paper | Pick any bank question and push it into a specific paper directly from the bank UI. |
| Auto-population | When a question is added to a paper inline, it is automatically saved to the bank too. |

---

## 7. Question Papers

| Feature | How it works |
|---|---|
| Paper properties | Title, subject, duration, total marks, pass percentage, negative marks. |
| Set ID | Each paper has a unique numeric Set ID. |
| Add questions | Add from bank (by ID) or create inline (auto-saves to bank). |
| Marks override | Per-paper mark weighting — override the bank default for a specific paper. |
| Soft delete | Papers go to Trash, not permanently deleted. Restore or empty from Trash. |
| AI paper generation | Enter topic, subject, question count, marks per question, difficulty level → Gemini AI generates a full MCQ paper. Preview all questions before saving. |

---

## 8. Tests

| Feature | How it works |
|---|---|
| Test creation | Link a paper to a test. Set name, code, scheduled date, start/end time. |
| Per-test overrides | Duration, negative marks, pass percentage can be overridden per test (otherwise inherited from paper). |
| Assign to batch/group | Assign a test to a batch, group, or individual student. |
| Status tracking | Upcoming → Live → Completed → Archived. |
| Test report | View pass/fail count, pass rate, average score, highest and lowest score per test. |
| Archive | Soft delete. Cannot delete a live test. |

---

## 9. Exam Environment (Student Side)

| Feature | How it works |
|---|---|
| Preflight screen | Shows exam rules before starting. Student must click "Enter Fullscreen and Begin". |
| Fullscreen enforcement | Exam does not start until fullscreen is active. |
| Violation tracking | Visible counter in the topbar. |
| Exit fullscreen | +1 violation. Full-screen overlay blocks exam until student returns to fullscreen. |
| Tab switch / window blur | +1 violation each. |
| Close / refresh attempt | +1 violation. |
| Right-click | Silently blocked. No violation counted. |
| Copy attempt | Silently blocked. No violation counted. |
| Auto-submit | At 5 violations, exam auto-submits after a 2-second warning. |
| Timer | Countdown displayed. Auto-submits when time runs out. |
| All violations logged | Every event is sent to the backend with type and description. |

---

## 10. Submissions & Results

| Feature | How it works |
|---|---|
| Auto-scoring | Score calculated immediately on submission based on correct answers and negative marking. |
| Pass / Fail | Determined by pass percentage set on the paper or test. |
| Answer review | After submission, student can review every question — see their answer, correct answer, marks obtained. Filter by All / Correct / Wrong / Skipped. |
| Re-grant access | Admin can delete a submission so the student can retake the exam. |
| Result publication | `is_published` flag on submission — admin controls when results are visible to students. |

---

## 11. Reports (Admin)

| Report | What it shows |
|---|---|
| Candidates | Total, approved, pending approval, active count. |
| Submissions | Total submissions, passed, failed, pass rate, average / highest / lowest score. |
| Malpractice | Total events, students flagged, breakdown by event type. |
| Courses | Each course with candidate count. |
| Batches | Each batch with member count, submissions, pass/fail, pass rate, average score. |
| Groups | Same as batches. |

---

## 12. Grievances

| Feature | How it works |
|---|---|
| Raise grievance | Student submits subject + description. Gets a unique tracking ID (e.g. `GRV-AB12CD34`). |
| Track status | Student sees Open / In Progress / Resolved. |
| Admin resolution | Admin views all grievances, updates status, adds a note. Filter by status. |

---

## 13. Feedback

| Feature | How it works |
|---|---|
| Submit feedback | Student submits a 1–5 star rating and optional comment after exam. |
| Admin view | Admin sees all feedback with ratings, comments, and timestamps. |

---

## 14. Tools

| Tool | What it does |
|---|---|
| ID Lookup | Query by Paper Set ID, Question ID, User ID, or CID (roll number). Returns full details instantly. |
| Audit Log | Every admin/staff action is recorded — who did what, on which entity, when. Filter by action keyword. |
| Trash | All soft-deleted users and papers. Restore individually or empty all permanently. |

---

## 15. Roles Management (Access Control)

| Feature | How it works |
|---|---|
| Admins | Create, edit, disable, delete admin accounts. |
| IT Coordinators | Same CRUD. |
| Exam Setters | Staff accounts pre-loaded with paper / question bank / test permissions. |
| Staff Permissions | Fine-grained permission toggle per staff member. |

---

## 16. Dark Mode

Toggle available on the login page, admin sidebar, and exam topbar.  
Preference saved to browser storage — persists across sessions.

---

## 17. Data Integrity Rules

| Rule | Detail |
|---|---|
| No hard deletes | Users and papers go to Trash first. Permanent delete only from Trash. |
| Question versioning | Editing a question creates a new version. Old version archived. |
| No redundancy | Question content stored once in the bank. Papers reference by ID only. |
| Audit trail | All admin actions logged with actor email (preserved even if account is deleted). |
| One course per candidate | Enforced at both DB and UI level. |
| Candidate approval | Students cannot log in until explicitly approved by admin. |

---

## 18. Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | FastAPI (Python) |
| Web server | Uvicorn (ASGI) |
| Database | SQLite via SQLAlchemy ORM |
| Data validation | Pydantic v2 |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| AI integration | Google Gemini 1.5 Flash (httpx async) |
| Frontend framework | React 18 + Vite 5 |
| Routing | React Router v6 |
| HTTP client | Axios |
| Styling | Plain CSS (no framework) |

---

## 19. How to Run

### Backend
```bash
cd exam-centre/backend
python -m uvicorn main:app --reload --port 8000
```

### Frontend (dev)
```bash
cd exam-centre/frontend
npm run dev
```
Open: `http://localhost:5173`

### Frontend (production build)
```bash
cd exam-centre/frontend
npm run build
# Backend serves the built frontend at http://localhost:8000
```

---

## 20. Default Admin Credentials

```
Email:    admin@examcentre.com
Password: Admin@1234
```

> Change the password after first login.

---

*Last updated: May 2026*
