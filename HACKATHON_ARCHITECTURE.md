# 🏗️ Hackathon System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│                     http://localhost:3000                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│                    http://localhost:8000                         │
├─────────────────────────────────────────────────────────────────┤
│  Routers:                                                        │
│  • /api/hackathons           - List/Create hackathons           │
│  • /api/hackathons/{id}      - Get/Update/Delete                │
│  • /api/hackathons/available - Student view                     │
│  • /api/hackathons/{id}/register - Register student             │
│  • /api/hackathons/bulk-upload-participants - CSV upload        │
│  • /api/hackathons/{id}/leaderboard - Rankings                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQLAlchemy ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (SQLite)                            │
│                    exam_centre.db                                │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                         │
│  • hackathons              - Hackathon definitions              │
│  • hackathon_participants  - Registration records               │
│  • question_papers         - Exam questions                     │
│  • submissions             - Student submissions                │
│  • users                   - Students & admins                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Database Schema

### `hackathons` Table
```sql
CREATE TABLE hackathons (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    paper_id INTEGER NOT NULL,              -- FK → question_papers.id
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    max_participants INTEGER,
    pass_percentage INTEGER DEFAULT 40,
    is_public BOOLEAN DEFAULT TRUE,
    show_leaderboard BOOLEAN DEFAULT TRUE,
    status VARCHAR DEFAULT 'upcoming',      -- upcoming|active|completed
    created_by_id INTEGER,                  -- FK → users.id
    created_at DATETIME DEFAULT NOW(),
    
    FOREIGN KEY (paper_id) REFERENCES question_papers(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);
```

### `hackathon_participants` Table
```sql
CREATE TABLE hackathon_participants (
    id INTEGER PRIMARY KEY,
    hackathon_id INTEGER NOT NULL,          -- FK → hackathons.id
    student_id INTEGER NOT NULL,            -- FK → users.id
    college_name VARCHAR,
    registered_at DATETIME DEFAULT NOW(),
    
    FOREIGN KEY (hackathon_id) REFERENCES hackathons(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    UNIQUE (hackathon_id, student_id)       -- Prevent duplicate registrations
);
```

### Enhanced `submissions` Table
```sql
-- Added hackathon_id column to existing table
ALTER TABLE submissions ADD COLUMN hackathon_id INTEGER;
ALTER TABLE submissions ADD FOREIGN KEY (hackathon_id) REFERENCES hackathons(id);
```

---

## 🔄 Data Flow

### Admin: Creating a Hackathon

```
Admin Dashboard
    │
    ▼
[Create Hackathon Form]
    │
    ├─ Name: "AWS Cloud Challenge"
    ├─ Paper: Select from QuestionPapers
    ├─ Start/End Time
    ├─ Duration: 30 minutes
    ├─ Settings: Public, Show Leaderboard
    │
    ▼
POST /api/hackathons
    │
    ▼
Backend Validation
    ├─ Check paper exists
    ├─ Validate times
    ├─ Check admin permissions
    │
    ▼
INSERT INTO hackathons
    │
    ▼
Return Hackathon ID
```

### Admin: Bulk Uploading Participants

```
Admin Dashboard
    │
    ▼
[Upload CSV File]
    │
    └─ CSV Format:
       name, email, college_name
       John Doe, john@email.com, MIT
    │
    ▼
POST /api/hackathons/bulk-upload-participants
    │
    ▼
Backend Processing
    ├─ Parse CSV
    ├─ Find/Create Users
    ├─ Create Participant Records
    │
    ▼
INSERT INTO hackathon_participants (batch)
    │
    ▼
Return Success Count
```

### Student: Registering for Hackathon

```
Student Dashboard
    │
    ▼
[Hackathons Page]
    │
    ├─ Browse Available Hackathons
    ├─ Filter by Status (upcoming/active)
    │
    ▼
[Click "Register Now"]
    │
    ▼
POST /api/hackathons/{id}/register
    {
      student_id: current_user.id,
      college_name: "Stanford"
    }
    │
    ▼
Backend Validation
    ├─ Check hackathon exists
    ├─ Check max_participants limit
    ├─ Check already registered
    │
    ▼
INSERT INTO hackathon_participants
    │
    ▼
Return Registration Confirmation
```

### Student: Taking Hackathon Exam

```
Student Dashboard
    │
    ▼
[Start Exam Button]
    │
    ▼
POST /api/hackathons/{id}/start-exam
    │
    ▼
Backend Processing
    ├─ Check registration status
    ├─ Check time window
    ├─ Create Submission record
    │
    ▼
INSERT INTO submissions
    (student_id, paper_id, hackathon_id)
    │
    ▼
Return: {submission_id, questions}
    │
    ▼
[SECURE POPUP WINDOW OPENS]
    │
    ├─ Fullscreen Mode
    ├─ Keyboard Blocking Active
    ├─ Tab Switch Detection
    │
    ▼
Student Answers Questions
    │
    ▼
POST /api/exam/submit
    {
      submission_id,
      answers: [{question_id, selected_option}]
    }
    │
    ▼
Backend Evaluation
    ├─ INSERT answers
    ├─ Calculate score
    ├─ Calculate rank
    ├─ UPDATE submission
    │
    ▼
Return: {score, rank, percentage, passed}
    │
    ▼
[Show Results + Auto-Close Popup]
```

### Student/Admin: Viewing Leaderboard

```
Hackathon Page
    │
    ▼
[Click "View Leaderboard"]
    │
    ▼
GET /api/hackathons/{id}/leaderboard
    │
    ▼
Backend Query
    SELECT 
        s.student_id,
        u.name,
        hp.college_name,
        s.score,
        s.percentage,
        s.rank,
        s.submitted_at
    FROM submissions s
    JOIN users u ON s.student_id = u.id
    JOIN hackathon_participants hp ON hp.student_id = u.id
    WHERE s.hackathon_id = {id}
    ORDER BY s.score DESC, s.submitted_at ASC
    │
    ▼
Return Ranked List
    │
    ▼
[Display Leaderboard Table]
    ├─ Rank | Name | College | Score | %
    ├─   1  | John | MIT     | 95    | 95%
    ├─   2  | Jane | Stanford| 90    | 90%
    └─  ...
```

---

## 🔐 Security Features in Popup Exam

### Window Isolation
```javascript
// Popup prevents access to main window
const popup = window.open('/exam', '_blank', 'width=1200,height=800');

// Student cannot Alt+G to access Gemini in main window
// Student cannot share screen of main window
```

### Keyboard Blocking
```javascript
// Blocks cheating shortcuts
- Alt+G       → Gemini AI access blocked
- Print Screen → Screenshot blocked
- Windows Key  → OS access blocked
- Ctrl+P      → Printing blocked
- F12         → DevTools blocked
```

### Fullscreen Enforcement
```javascript
// Monitor fullscreen status
if (!document.fullscreenElement) {
    violations++;
    document.documentElement.requestFullscreen();
}
```

### Tab Switch Detection
```javascript
// Track when student leaves exam
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        tabSwitches++;
        logViolation('tab_switch');
    }
});
```

---

## 📊 API Endpoints Reference

### Public Endpoints (No Auth)
None - all hackathon endpoints require authentication

### Student Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hackathons/available` | GET | List available hackathons |
| `/api/hackathons/my-hackathons` | GET | List registered hackathons |
| `/api/hackathons/{id}` | GET | Get hackathon details |
| `/api/hackathons/{id}/register` | POST | Register for hackathon |
| `/api/hackathons/{id}/leaderboard` | GET | View rankings |

### Admin Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hackathons` | GET | List all hackathons (with filters) |
| `/api/hackathons` | POST | Create new hackathon |
| `/api/hackathons/{id}` | PUT | Update hackathon |
| `/api/hackathons/{id}` | DELETE | Delete hackathon |
| `/api/hackathons/bulk-upload-participants` | POST | Upload CSV participants |
| `/api/hackathons/{id}/participants` | GET | List participants |

---

## 🎯 Key Features Implemented

### ✅ Admin Features
- [x] Create/Edit/Delete hackathons
- [x] Bulk participant upload via CSV
- [x] View participant list
- [x] View leaderboard
- [x] Configure pass percentage
- [x] Set max participants
- [x] Public/private toggle
- [x] Schedule with start/end times

### ✅ Student Features
- [x] Browse available hackathons
- [x] One-click registration
- [x] Take exam in secure popup
- [x] View results & rank instantly
- [x] View leaderboard (if enabled)
- [x] See registration status

### ✅ Security Features
- [x] Popup window isolation
- [x] Keyboard shortcut blocking
- [x] Fullscreen enforcement
- [x] Tab switch detection
- [x] Violation tracking
- [x] Auto-close after submission

### ✅ Backend Features
- [x] SQLAlchemy ORM models
- [x] FastAPI REST endpoints
- [x] Automatic ranking calculation
- [x] Time-based status updates
- [x] Participant limit enforcement
- [x] Duplicate registration prevention

---

## 🚀 Deployment Checklist

- [x] Database models defined
- [x] Database tables created
- [x] API routes registered
- [x] Frontend components built
- [x] Navigation integrated
- [x] Security features active
- [x] Backend server running
- [x] Frontend server running
- [x] CORS configured
- [x] Error handling implemented

**Status: PRODUCTION READY** ✅

