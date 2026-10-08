# 🏆 Hackathon Management System Guide

## Overview
Complete hackathon management system with admin controls, bulk participant registration, live leaderboards, and secure exam environment.

---

## 🔧 Admin Side Features

### 1. **Create Hackathon**
- Navigate to: **Admin → Hackathons → Create Hackathon**
- Fill in:
  - Name (e.g., "AWS Cloud Quiz Challenge 2024")
  - Description
  - Question Paper (select from existing papers)
  - Start & End Date/Time
  - Duration in minutes
  - Max Participants (optional - leave empty for unlimited)
  - Pass Percentage
  - Public Registration (checkbox)
  - Show Live Leaderboard (checkbox)

### 2. **Bulk Upload Participants**
- Click **"📤 Bulk Upload"** on any hackathon
- Download CSV template
- Fill with participant data:
  ```csv
  full_name,email,phone,college_name
  John Doe,john@email.com,9876543210,ABC College
  Jane Smith,jane@email.com,9876543211,XYZ University
  ```
- Upload file
- Set default password for all participants
- System will:
  - Create user accounts automatically
  - Register them for the hackathon
  - Generate unique roll numbers

### 3. **View Participants**
- Click **"Participants"** button
- See all registered participants
- Check who has submitted

### 4. **View Leaderboard**
- Click **"🏆 Leaderboard"** button
- See real-time rankings
- View scores, time taken, and colleges
- Top 3 get 🥇🥈🥉 medals

### 5. **Hackathon Status**
- **UPCOMING**: Before start time
- **LIVE NOW**: Currently active
- **ENDED**: Past end time

---

## 👨‍🎓 Student Side Features

### 1. **View Available Hackathons**
- Navigate to: **Dashboard → 🏆 Hackathons** button
- See all public hackathons
- Filter by:
  - **Available**: Hackathons you can register for
  - **My Hackathons**: Hackathons you've registered for

### 2. **Register for Hackathon**
- Click **"✅ Register Now"** on any available hackathon
- Instant registration
- Moves to "My Hackathons" tab

### 3. **Start Hackathon**
- When hackathon is **LIVE**
- Click **"🚀 Start Hackathon"**
- Opens in **secure popup window** with:
  - ✅ Fullscreen enforcement
  - ✅ Alt+G blocked (no AI assistance)
  - ✅ Tab switching detection
  - ✅ Screenshot prevention
  - ✅ Copy/paste disabled
  - ✅ Timer countdown
  - ✅ Auto-submit on violations

### 4. **View Results**
- After submission, see:
  - Your score
  - Your rank (🥇🥈🥉 or #number)
  - Time taken
  - Pass/Fail status
- Click **"📝 Review Answers"** to see detailed breakdown
- Click **"🏆 Leaderboard"** to see all rankings

---

## 📊 Key Features

### **Bulk Registration System**
- Upload 100s of participants at once
- Auto-create user accounts
- Auto-generate credentials
- CSV/Excel format support

### **Live Leaderboard**
- Real-time rankings
- Sorted by score (highest first)
- Secondary sort by submission time (fastest first)
- Shows:
  - Rank with medals for top 3
  - Student name
  - Score / Total marks
  - Time taken
  - College name

### **Secure Exam Environment**
- Opens in isolated popup window
- Fullscreen mandatory
- All security features from regular exams
- **Special hackathon features**:
  - Max participants limit
  - Public registration option
  - Start/end time window
  - Instant results

### **Status Management**
- **Upcoming**: Can register, can't start
- **Active**: Can register AND start exam
- **Completed**: Can view results and leaderboard

---

## 🎯 Typical Hackathon Workflow

### **Admin Setup:**
1. Create question paper with AWS/Aptitude questions
2. Create hackathon event
3. Bulk upload participants (or enable public registration)
4. Share registration link/credentials

### **Before Hackathon:**
- Students register (if public)
- Students receive credentials (if bulk uploaded)
- Admin monitors participant count

### **During Hackathon:**
- Students start exam in secure window
- Live leaderboard updates in real-time
- Admin monitors submissions

### **After Hackathon:**
- Results automatically calculated
- Leaderboard finalized
- Students can review answers
- Admin can export results

---

## 📁 File Formats

### **Participant CSV Template:**
```csv
full_name,email,phone,college_name
John Doe,john@email.com,9876543210,ABC College
Jane Smith,jane@email.com,9876543211,XYZ University
```

**Required fields:**
- `full_name`: Participant's full name
- `email`: Unique email (becomes username)

**Optional fields:**
- `phone`: Contact number
- `college_name`: Institution name

---

## 🔐 Security Features

### **For Hackathons:**
- Same security as regular exams PLUS:
- Popup window isolation
- Public registration with email verification
- Bulk credential management
- Time-bound access (start/end time)
- Participant limit enforcement

### **For Participants:**
- Unique credentials
- One-time submission
- Activity tracking
- Violation monitoring

---

## 🚀 Quick Start Guide

### **Run Your First Hackathon:**

1. **Admin: Create Hackathon**
   ```
   Admin → Hackathons → Create Hackathon
   Name: "AWS Cloud Challenge"
   Paper: AWS Hackathon Quiz (25 questions)
   Duration: 60 minutes
   Public Registration: ✓
   ```

2. **Admin: Upload Participants**
   ```
   Click "📤 Bulk Upload"
   Upload CSV with participants
   Default Password: Hackathon@2024
   ```

3. **Students: Register**
   ```
   Dashboard → 🏆 Hackathons
   Click "✅ Register Now"
   ```

4. **Students: Take Hackathon**
   ```
   When LIVE → Click "🚀 Start Hackathon"
   Complete in popup window
   Submit answers
   ```

5. **View Results**
   ```
   Students: See score & rank
   Admin: View leaderboard
   Export results if needed
   ```

---

## 💡 Tips & Best Practices

### **For Admins:**
- ✅ Test hackathon with a few users first
- ✅ Set realistic duration (1-2 hours typical)
- ✅ Enable leaderboard for competitive spirit
- ✅ Set max participants if needed
- ✅ Bulk upload participants 1 day before
- ✅ Share credentials via email

### **For Participants:**
- ✅ Test login before hackathon starts
- ✅ Ensure stable internet connection
- ✅ Allow popups for the site
- ✅ Use Chrome/Firefox for best experience
- ✅ Read all questions carefully
- ✅ Watch the timer
- ✅ Submit before time runs out

### **Common Issues:**
- **Popup blocked?** → Allow popups in browser settings
- **Can't register?** → Check if hackathon is full
- **Can't start?** → Wait for start time
- **Exam auto-submitted?** → Too many violations (5 max)

---

## 📞 Support

For issues or questions:
- Check browser console for errors
- Verify internet connection
- Contact system administrator
- Check EXAM_SECURITY_FEATURES.md for exam rules

---

**Version**: 2.2.0  
**Last Updated**: October 2026  
**Feature**: Hackathon Management System
