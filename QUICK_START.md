# 🚀 Quick Start Guide

## System is Running!

✅ **Backend**: http://localhost:8000  
✅ **Frontend**: http://localhost:3000  
✅ **Database**: All tables created including hackathons

---

## 🎯 Create Your First Hackathon (5 minutes)

### Step 1: Login as Admin
1. Open http://localhost:3000
2. Login with admin credentials

### Step 2: Create Hackathon
1. Click **Admin** in navigation
2. Click **Hackathons** section
3. Click **"Create Hackathon"** button
4. Fill the form:
   ```
   Name: AWS Cloud Challenge
   Description: Test your AWS knowledge
   Paper: AWS_H (Paper ID: 2)
   Start Time: [Current date/time]
   End Time: [1 hour later]
   Duration: 30 minutes
   Max Participants: 100
   Pass Percentage: 40
   Public: ✓ Yes
   Show Leaderboard: ✓ Yes
   ```
5. Click **"Create"**

### Step 3: Upload Participants (CSV)
1. In Hackathons section, find your hackathon
2. Click **"📤 Upload Participants"**
3. Download the CSV template
4. Fill it:
   ```csv
   name,email,college_name
   Alice Johnson,alice@email.com,MIT
   Bob Smith,bob@email.com,Stanford
   Carol Davis,carol@email.com,Harvard
   ```
5. Upload the CSV file
6. Review the list
7. Click **"Save All Participants"**

### Step 4: Students Take Exam
1. Logout and login as a student
2. Click **"🏆 Hackathons"** button on dashboard
3. Find "AWS Cloud Challenge"
4. Click **"Register Now"** (if not bulk uploaded)
5. Click **"Start Exam"**
6. **Secure popup window opens** with exam
7. Answer questions
8. Click **"Submit"**
9. See your score and rank!

### Step 5: View Leaderboard
1. Login as admin (or student)
2. Go to Hackathons
3. Click **"🏆 Leaderboard"** on the hackathon
4. See real-time rankings

---

## 📁 CSV Template Format

```csv
name,email,college_name
John Doe,john@example.com,MIT
Jane Smith,jane@example.com,Stanford
```

**Rules:**
- First row MUST be headers: `name,email,college_name`
- Email should be valid format
- College name is optional

---

## 🔑 Sample Test Credentials

If you need test users, you can create them or use existing ones in your database.

---

## 🛠️ Troubleshooting

### Backend not responding?
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend not loading?
```bash
cd frontend-next
npm run dev
```

### Check if servers are running:
- Backend health: http://localhost:8000/api/docs
- Frontend: http://localhost:3000

---

## 📚 Full Documentation

- **HACKATHON_STATUS.md** - Detailed status & features
- **HACKATHON_ARCHITECTURE.md** - System architecture
- **HACKATHON_GUIDE.md** - Complete user guide
- **README_HACKATHON.md** - Technical documentation

---

## 🎊 You're All Set!

The hackathon system is fully operational with:
- ✅ Secure popup exams (prevents Alt+G cheating)
- ✅ Bulk participant upload
- ✅ Real-time leaderboard
- ✅ Automatic ranking
- ✅ All security features active

**Start creating hackathons now!** 🚀
