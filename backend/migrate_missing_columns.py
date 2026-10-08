"""
Add missing columns to submissions table
"""
import sqlite3

conn = sqlite3.connect('exam_centre.db')
cursor = conn.cursor()

# Check current columns
cursor.execute('PRAGMA table_info(submissions)')
existing_cols = [row[1] for row in cursor.fetchall()]
print(f"Existing columns: {existing_cols}")

# Add missing columns
if 'created_at' not in existing_cols:
    cursor.execute('ALTER TABLE submissions ADD COLUMN created_at DATETIME')
    print("✓ Added created_at")

if 'total_marks' not in existing_cols:
    cursor.execute('ALTER TABLE submissions ADD COLUMN total_marks INTEGER')
    print("✓ Added total_marks")

conn.commit()

# Verify
cursor.execute('PRAGMA table_info(submissions)')
final_cols = [row[1] for row in cursor.fetchall()]
print(f"\nFinal columns: {final_cols}")

conn.close()
