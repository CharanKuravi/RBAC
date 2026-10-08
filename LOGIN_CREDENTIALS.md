# 🔑 Login Credentials

## Admin Account

**Email:** `admin@examcentre.com`  
**Password:** `Admin@1234`  
**Role:** Admin

**Access:**
- Full admin dashboard
- Create/manage tests, hackathons
- Manage users, batches, groups
- View all reports and analytics
- Access to all system features

**Login URL:** http://localhost:3000/login

---

## Student Accounts

Current student accounts in database:

1. **CHARAN K**
   - Email: `alice@attendx.dev`
   - ID: 1
   - Batch: Batch #1
   - Has submitted Test #1

2. **sai ram**
   - Email: `aline@attendx.dev`
   - ID: 3
   - Batch: Batch #1
   - Has submitted Test #1

3. **Student ID 4**
   - Email: `alace@attendx.dev`
   - ID: 4
   - Batch: Batch #1
   - Has submitted Test #1

**Note:** Student passwords are set when accounts are created. If you don't know them, reset using admin panel or database.

---

## How to Create New Users

### As Admin:

1. **Create Students:**
   ```
   Admin → Users → Bulk Upload
   Or
   Admin → Registration → Manual Registration
   ```

2. **Create Staff:**
   ```
   Admin → Users → Add User
   Set role: staff
   ```

3. **Promote Users:**
   ```
   Admin → Access Control → Access Requests
   Students can request role upgrades
   Admin approves/denies
   ```

---

## Password Reset

### Method 1: Via Database (if admin password forgotten)
```bash
cd backend
python -c "from database import SessionLocal; from models import User; from auth import hash_password; db = SessionLocal(); admin = db.query(User).filter(User.email == 'admin@examcentre.com').first(); admin.hashed_password = hash_password('NewPassword123'); db.commit(); print('Password reset to: NewPassword123'); db.close()"
```

### Method 2: Create New Admin
```bash
cd backend
python create_admin.py
# Will show "Admin already exists" but you can modify the script
```

---

## Role Permissions

### Admin
- Full system access
- All admin features
- All API endpoints

### Staff
- Limited admin access
- Can view reports
- Cannot delete users

### Student
- Own dashboard only
- Take assigned tests
- View own results
- Cannot access admin features

### IT Coordinator
- Technical system access
- User management
- System configuration

---

## Quick Access URLs

- **Login:** http://localhost:3000/login
- **Admin Dashboard:** http://localhost:3000/admin
- **Student Dashboard:** http://localhost:3000/dashboard
- **Hackathons (Student):** http://localhost:3000/hackathons
- **API Docs:** http://localhost:8000/api/docs

---

## Troubleshooting

### "403 Forbidden" on Admin Page
**Cause:** Logged in as student, not admin

**Solution:**
1. Logout
2. Login with admin credentials above
3. Try again

### "Invalid credentials"
**Cause:** Wrong email or password

**Solution:**
- Double-check email: `admin@examcentre.com`
- Double-check password: `Admin@1234` (case-sensitive)
- If still not working, reset password using database method above

### "Cannot access /admin"
**Cause:** Not logged in or session expired

**Solution:**
1. Go to /login
2. Login with admin credentials
3. Navigate to /admin

---

## Security Notes

⚠️ **IMPORTANT:**
- Change default admin password after first login
- Use strong passwords for production
- Don't commit passwords to Git
- Rotate passwords regularly
- Use environment variables for sensitive data

---

**Current Status: Admin account active and ready to use!** ✅
