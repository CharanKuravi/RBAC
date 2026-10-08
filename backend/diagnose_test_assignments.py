"""
Diagnostic script to check test assignments
"""
from database import SessionLocal
from models import User, Test, TestAssignment, BatchMember, GroupMember, Submission

db = SessionLocal()

print("=" * 80)
print("TEST ASSIGNMENT DIAGNOSTIC")
print("=" * 80)

# Get all tests
tests = db.query(Test).filter(Test.is_deleted == False).all()
print(f"\n📋 TOTAL TESTS: {len(tests)}")
for t in tests:
    print(f"   - Test #{t.id}: {t.name} (Paper ID: {t.paper_id}, Status: {t.status})")

# Get all test assignments
assignments = db.query(TestAssignment).all()
print(f"\n📌 TOTAL ASSIGNMENTS: {len(assignments)}")
for a in assignments:
    print(f"   - Assignment #{a.id}:")
    if a.student_id:
        student = db.query(User).filter(User.id == a.student_id).first()
        print(f"      → Student: {student.full_name if student else 'Unknown'} (ID: {a.student_id})")
    if a.batch_id:
        print(f"      → Batch ID: {a.batch_id}")
    if a.group_id:
        print(f"      → Group ID: {a.group_id}")
    print(f"      → Test ID: {a.test_id}")

# Get all students
students = db.query(User).filter(User.role == 'student').all()
print(f"\n👥 TOTAL STUDENTS: {len(students)}")
for s in students:
    print(f"   - {s.full_name} ({s.email}) - ID: {s.id}")
    
    # Check their batch memberships
    batches = db.query(BatchMember).filter(BatchMember.student_id == s.id).all()
    if batches:
        print(f"      Batches: {[b.batch_id for b in batches]}")
    
    # Check their group memberships
    groups = db.query(GroupMember).filter(GroupMember.student_id == s.id).all()
    if groups:
        print(f"      Groups: {[g.group_id for g in groups]}")
    
    # Calculate their assigned tests
    test_ids = set()
    
    # Direct assignments
    direct = db.query(TestAssignment).filter(TestAssignment.student_id == s.id).all()
    for a in direct:
        test_ids.add(a.test_id)
    
    # Via batch
    for bm in batches:
        batch_assigns = db.query(TestAssignment).filter(TestAssignment.batch_id == bm.batch_id).all()
        for a in batch_assigns:
            test_ids.add(a.test_id)
    
    # Via group
    for gm in groups:
        group_assigns = db.query(TestAssignment).filter(TestAssignment.group_id == gm.group_id).all()
        for a in group_assigns:
            test_ids.add(a.test_id)
    
    print(f"      Assigned Test IDs: {list(test_ids) if test_ids else 'NONE'}")
    
    # Check submissions
    submissions = db.query(Submission).filter(Submission.student_id == s.id).all()
    if submissions:
        print(f"      Submissions: {len(submissions)}")

print("\n" + "=" * 80)
print("DIAGNOSIS COMPLETE")
print("=" * 80)

db.close()
