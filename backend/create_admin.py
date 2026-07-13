"""
Run this once to create the initial admin account.
Usage: python create_admin.py
"""
from database import SessionLocal, engine
import models
from auth import hash_password

models.Base.metadata.create_all(bind=engine)

ADMIN_EMAIL = "admin@examcentre.com"
ADMIN_PASSWORD = "Admin@1234"

db = SessionLocal()

existing = db.query(models.User).filter(models.User.email == ADMIN_EMAIL).first()
if existing:
    print(f"Admin already exists: {ADMIN_EMAIL}")
else:
    admin = models.User(
        email=ADMIN_EMAIL,
        hashed_password=hash_password(ADMIN_PASSWORD),
        role=models.UserRole.admin,
        roll_number=None,
    )
    db.add(admin)
    db.commit()
    print(f"Admin created successfully.")
    print(f"  Email   : {ADMIN_EMAIL}")
    print(f"  Password: {ADMIN_PASSWORD}")
    print(f"  Change the password after first login.")

db.close()
