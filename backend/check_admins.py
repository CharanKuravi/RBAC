from database import SessionLocal
from models import User

db = SessionLocal()

admins = db.query(User).filter(User.role.in_(['admin', 'super_admin'])).all()

print("=" * 80)
print("ADMIN ACCOUNTS")
print("=" * 80)

if not admins:
    print("\n❌ NO ADMIN ACCOUNTS FOUND!")
    print("\nTo create an admin account, run:")
    print("  python create_admin.py")
else:
    print(f"\n✅ Found {len(admins)} admin account(s):\n")
    for a in admins:
        print(f"  Email:     {a.email}")
        print(f"  Role:      {a.role}")
        print(f"  Full Name: {a.full_name}")
        print(f"  ID:        {a.id}")
        print()

db.close()
