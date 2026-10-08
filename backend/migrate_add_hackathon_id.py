"""
Migration script to add hackathon_id column to submissions table
"""
import sqlite3

db_path = "exam_centre.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 80)
print("MIGRATION: Adding hackathon_id to submissions table")
print("=" * 80)

try:
    # Check if column exists
    cursor.execute("PRAGMA table_info(submissions)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'hackathon_id' in columns:
        print("\n✓ Column 'hackathon_id' already exists in submissions table")
    else:
        print("\n→ Adding 'hackathon_id' column to submissions table...")
        cursor.execute("ALTER TABLE submissions ADD COLUMN hackathon_id INTEGER")
        conn.commit()
        print("✓ Column added successfully!")
    
    # Verify
    cursor.execute("PRAGMA table_info(submissions)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"\n📋 Submissions table columns: {columns}")
    
    print("\n" + "=" * 80)
    print("MIGRATION COMPLETE")
    print("=" * 80)
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    conn.rollback()
finally:
    conn.close()
