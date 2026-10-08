"""
Diagnostic script to check test assignments and why students can't see tests.
"""

from database import SessionLocal
import models

db = SessionLocal()

print("=" * 70)
print("🔍 DIAGNOSING TEST ASSIGNMENT ISSUES")
print("=" * 70)

# Check tests
tests = db.query(models.Test).filter(models.Test.is_deleted == False).all()
print(f"\n📝 Total Tests Created: {len(tests)}")
for t in tests:
    print(f"   • Test #{t.id}: {t.name} (Status: {t.status}, Paper: {t.paper_id})")

# Check test assignments
assignments = db.query(models.TestAssignment).all()
print(f"\n📋 Total Test Assignments: {len(assignments)}")
for a in assignments:
    if a.student_id:
        student = db.query(models.User).get(a.student_id)
        print(f"   • Test #{a.test_id} → Student: {student.roll_number if student else 'Unknown'}")
    elif a.batch_id:
        batch = db.query(models.Batch).get(a.batch_id)
        print(f"   • Test #{a.test_id} → Batch: {batch.name if batch else 'Unknown'}")
    elif a.group_id:
        group = db.query(models.Group).get(a.group_id)
        print(f"   • Test #{a.test_id} → Group: {group.name if group else 'Unknown'}")

# Check students
students = db.query(models.User).filter(models.User.role == 'student').all()
print(f"\n👨‍🎓 Total Students: {len(students)}")
for s in students[:10]:  # Show first 10
    print(f"   • {s.roll_number or s.email} (ID: {s.id})")

# Check batches
batches = db.query(models.Batch).all()
print(f"\n📚 Total Batches: {len(batches)}")
for b in batches:
    members = db.query(models.BatchMember).filter(models.BatchMember.batch_id == b.id).count()
    print(f"   • Batch: {b.name} (ID: {b.id}) - {members} members")

# Check groups
groups = db.query(models.Group).all()
print(f"\n👥 Total Groups: {len(groups)}")
for g in groups:
    members = db.query(models.GroupMember).filter(models.GroupMember.group_id == g.id).count()
    print(f"   • Group: {g.name} (ID: {g.id}) - {members} members")

# Check batch memberships
batch_members = db.query(models.BatchMember).all()
print(f"\n🔗 Total Batch Memberships: {len(batch_members)}")
for bm in batch_members[:10]:
    student = db.query(models.User).get(bm.student_id)
    batch = db.query(models.Batch).get(bm.batch_id)
    print(f"   • {student.roll_number if student else 'Unknown'} → Batch: {batch.name if batch else 'Unknown'}")

# Check group memberships  
group_members = db.query(models.GroupMember).all()
print(f"\n🔗 Total Group Memberships: {len(group_members)}")
for gm in group_members[:10]:
    student = db.query(models.User).get(gm.student_id)
    group = db.query(models.Group).get(gm.group_id)
    print(f"   • {student.roll_number if student else 'Unknown'} → Group: {group.name if group else 'Unknown'}")

print("\n" + "=" * 70)
print("🔍 DIAGNOSIS:")
print("=" * 70)

if len(tests) == 0:
    print("❌ NO TESTS CREATED - Create a test first in Admin → Tests")
elif len(assignments) == 0:
    print("❌ NO TEST ASSIGNMENTS - Assign tests to batches/groups in Admin → Tests → Assign")
elif len(students) == 0:
    print("❌ NO STUDENTS - Create students first in Admin → Students or Bulk Upload")
elif len(batches) == 0 and len(groups) == 0:
    print("⚠️  NO BATCHES OR GROUPS - Create batches/groups and add students to them")
elif len(batch_members) == 0 and len(group_members) == 0:
    print("⚠️  STUDENTS NOT IN ANY BATCH/GROUP - Add students to batches or groups")
else:
    print("✅ Everything looks configured. Let me check specific student...")
    
    # Pick first student and check what tests they should see
    if students:
        test_student = students[0]
        print(f"\n🧪 Testing for student: {test_student.roll_number or test_student.email}")
        
        # Check direct assignments
        direct = db.query(models.TestAssignment).filter(
            models.TestAssignment.student_id == test_student.id
        ).count()
        print(f"   • Direct assignments: {direct}")
        
        # Check batch assignments
        student_batches = db.query(models.BatchMember).filter(
            models.BatchMember.student_id == test_student.id
        ).all()
        batch_test_count = 0
        for bm in student_batches:
            count = db.query(models.TestAssignment).filter(
                models.TestAssignment.batch_id == bm.batch_id
            ).count()
            batch_test_count += count
        print(f"   • Via batches: {batch_test_count} tests")
        
        # Check group assignments
        student_groups = db.query(models.GroupMember).filter(
            models.GroupMember.student_id == test_student.id
        ).all()
        group_test_count = 0
        for gm in student_groups:
            count = db.query(models.TestAssignment).filter(
                models.TestAssignment.group_id == gm.group_id
            ).count()
            group_test_count += count
        print(f"   • Via groups: {group_test_count} tests")
        
        total = direct + batch_test_count + group_test_count
        print(f"   • TOTAL VISIBLE TESTS: {total}")
        
        if total == 0:
            print("\n❌ THIS STUDENT SHOULD SEE 0 TESTS")
            print("   Solution: Assign tests to student's batch or group")

print("=" * 70)

db.close()
