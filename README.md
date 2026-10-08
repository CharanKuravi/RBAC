# 🎓 Exam Centre - Role-Based Access Control System

A comprehensive exam management platform with RBAC, secure testing environment, and hackathon support.

![Status](https://img.shields.io/badge/status-production--ready-green)
![Backend](https://img.shields.io/badge/backend-FastAPI-009688)
![Frontend](https://img.shields.io/badge/frontend-Next.js%2016-black)
![Database](https://img.shields.io/badge/database-SQLite-003B57)

## 🌟 Features

### 🔐 Security & Authentication
- **Role-Based Access Control (RBAC)** - Admin, Student, Staff roles with granular permissions
- **Secure Exam Environment** - Popup window isolation with keyboard blocking
- **Anti-Cheating Measures**:
  - Alt+G blocking (prevents Gemini AI access)
  - Print Screen disabled
  - Windows key blocked
  - Fullscreen enforcement
  - Tab switch detection
  - Violation tracking

### 📝 Exam Management
- **Question Bank System** - Centralized question repository
- **Paper Creation** - Dynamic paper generation from question bank
- **Bulk Question Upload** - CSV/Excel import with AI-powered extraction (PDF/Word/Images)
- **Test Assignment** - Assign to individual students, batches, or groups
- **Auto-Evaluation** - Instant scoring and ranking
- **Results & Analytics** - Detailed performance reports

### 🏆 Hackathon System
- **Event Management** - Create and manage hackathon competitions
- **Bulk Participant Upload** - CSV import for mass registration
- **Real-Time Leaderboard** - Live rankings during events
- **Public/Private Events** - Configurable registration access
- **Automatic Ranking** - Score-based participant ranking

### 👥 User Management
- **Batch Management** - Organize students into batches
- **Group Management** - Create custom student groups
- **Access Requests** - Student role upgrade workflow
- **Bulk User Import** - CSV-based user creation

### 📊 Additional Features
- **Certificates** - Automated certificate generation (PDF)
- **Hall Tickets** - Downloadable exam admission tickets
- **Grievance System** - Student complaint management with tracking
- **Feedback System** - Course and exam feedback collection
- **Audit Logs** - Complete activity tracking for compliance

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/CharanKuravi/RBAC.git
cd RBAC
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r ../requirements.txt

# Create admin user
python create_admin.py

# Run migrations (if needed)
python migrate_add_hackathon_id.py
python migrate_missing_columns.py

# Start backend server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**

API Documentation: **http://localhost:8000/api/docs**

### 3. Frontend Setup
```bash
cd frontend-next

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

---

## 📁 Project Structure

```
RBAC/
├── backend/
│   ├── routers/              # API route handlers
│   │   ├── hackathon_router.py
│   │   ├── test_router.py
│   │   ├── exam_router.py
│   │   └── ... (15+ routers)
│   ├── models.py             # Database models
│   ├── schemas.py            # Pydantic schemas
│   ├── auth.py               # Authentication logic
│   ├── database.py           # Database connection
│   └── main.py               # FastAPI app entry
│
├── frontend-next/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   │   ├── admin/        # Admin dashboard
│   │   │   ├── dashboard/    # Student dashboard
│   │   │   ├── exam/         # Exam interface
│   │   │   └── hackathons/   # Hackathon page
│   │   ├── components/       # React components
│   │   │   └── sections/     # Admin section components
│   │   ├── context/          # React context (theme)
│   │   └── styles/           # CSS stylesheets
│   └── package.json
│
├── requirements.txt          # Python dependencies
├── .gitignore
└── README.md
```

---

## 🔧 Configuration

### Backend Environment Variables
Create `backend/.env`:
```env
# Optional: Add if needed
SECRET_KEY=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key  # For AI question extraction
```

### Database
- Uses SQLite by default: `backend/exam_centre.db`
- Automatically created on first run
- No separate database setup required

---

## 📖 User Guide

### Admin Workflow

1. **Login** at http://localhost:3000 with admin credentials
2. **Create Question Bank**:
   - Navigate to Admin → Question Bank
   - Add questions manually or bulk upload (CSV/Excel/PDF)
3. **Create Question Papers**:
   - Go to Admin → Papers
   - Select questions from question bank
4. **Create Tests**:
   - Admin → Tests
   - Select paper, set schedule, duration
5. **Assign Tests**:
   - Assign to individual students, batches, or groups
6. **Create Hackathons**:
   - Admin → Hackathons
   - Select paper, set times, upload participants
7. **Monitor Results**:
   - View submissions, leaderboards, analytics

### Student Workflow

1. **Login** at http://localhost:3000
2. **Dashboard** shows:
   - Assigned tests
   - Results
   - Certificates
3. **Take Exam**:
   - Click "Take Exam" (opens secure popup)
   - Answer questions
   - Submit (auto-closes after 5s)
4. **View Results**:
   - Score, rank, pass/fail status
   - Review answers
5. **Hackathons**:
   - Click "🏆 Hackathons" button
   - Register for events
   - Take hackathon exam
   - View leaderboard

---

## 🎯 Key Technologies

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation
- **JWT** - Authentication tokens
- **Pandas** - CSV/Excel processing
- **Google Generative AI** - AI question extraction

### Frontend
- **Next.js 16** - React framework with Turbopack
- **React 19** - UI library
- **Axios** - HTTP client
- **CSS Modules** - Component styling

### Database
- **SQLite** - Lightweight relational database
- 25+ tables with proper relationships

---

## 🔒 Security Features

1. **Popup Window Isolation** - Exams run in separate window
2. **Keyboard Blocking** - Prevents access to external tools
3. **Fullscreen Enforcement** - Auto re-entry on exit
4. **Tab Switch Detection** - Tracks violations
5. **JWT Authentication** - Secure token-based auth
6. **RBAC** - Role-based permission system
7. **Audit Logging** - All actions tracked

---

## 📚 Documentation

- **[HACKATHON_GUIDE.md](./HACKATHON_GUIDE.md)** - Complete hackathon feature guide
- **[HACKATHON_ARCHITECTURE.md](./HACKATHON_ARCHITECTURE.md)** - System architecture
- **[EXAM_SECURITY_FEATURES.md](./EXAM_SECURITY_FEATURES.md)** - Security implementation
- **[FEATURES.md](./FEATURES.md)** - Complete feature list
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide

---

## 🐛 Troubleshooting

### Backend won't start
```bash
cd backend
python -m uvicorn main:app --reload
# Check for errors in terminal
```

### Frontend won't start
```bash
cd frontend-next
rm -rf .next node_modules
npm install
npm run dev
```

### Database issues
```bash
cd backend
# Run migrations
python migrate_add_hackathon_id.py
python migrate_missing_columns.py

# Or delete database and restart (WARNING: loses data)
rm exam_centre.db
python -m uvicorn main:app --reload
```

### Tests not showing for students
```bash
cd backend
python diagnose_test_assignments.py
# Check if student is in batch/group assigned to test
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 Database Schema

### Key Tables
- `users` - All system users (students, staff, admin)
- `question_bank` - Centralized question repository
- `question_papers` - Exam paper definitions
- `tests` - Scheduled test instances
- `test_assignments` - Student/batch/group assignments
- `submissions` - Student exam submissions
- `hackathons` - Hackathon events
- `hackathon_participants` - Registrations
- `batches` - Student batches
- `groups` - Custom student groups
- `certificates` - Generated certificates
- `audit_logs` - System activity tracking

---

## 📊 API Endpoints

### Core
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info

### Tests
- `GET /api/tests/my-tests` - Student's assigned tests
- `POST /api/tests` - Create test (admin)
- `POST /api/tests/{id}/assign` - Assign test (admin)

### Exams
- `POST /api/exam/start` - Start exam
- `POST /api/exam/submit` - Submit answers
- `GET /api/exam/my-results` - View results

### Hackathons
- `GET /api/hackathons` - List all (admin)
- `GET /api/hackathons/available` - Available hackathons (student)
- `POST /api/hackathons` - Create hackathon
- `POST /api/hackathons/{id}/register` - Register student
- `GET /api/hackathons/{id}/leaderboard` - View rankings
- `POST /api/hackathons/bulk-upload-participants` - Upload CSV

Full API docs: http://localhost:8000/api/docs

---

## 🎊 Status

✅ **Production Ready**
- All features implemented and tested
- Database migrations complete
- Security features active
- Both servers running successfully

---

## 📧 Contact

**Charan Kuravi**
- GitHub: [@CharanKuravi](https://github.com/CharanKuravi)
- Repository: [RBAC](https://github.com/CharanKuravi/RBAC)

---

## 📄 License

This project is available for educational and commercial use.

---

## 🙏 Acknowledgments

Built with modern technologies:
- FastAPI community
- Next.js team
- React community
- Python ecosystem

---

**Made with ❤️ for secure online examinations**
