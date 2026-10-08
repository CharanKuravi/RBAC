"""
Seed sample questions into the question bank for testing.
Run this script to add static questions to your database.
"""

from database import SessionLocal, engine
import models

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Sample questions data
SAMPLE_QUESTIONS = [
    # Computer Science Questions
    {
        "question_text": "What does CPU stand for?",
        "option_a": "Central Processing Unit",
        "option_b": "Computer Personal Unit",
        "option_c": "Central Program Utility",
        "option_d": "Central Processor Utility",
        "correct_option": "A",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Computer Science",
        "topic": "Hardware Basics"
    },
    {
        "question_text": "Which programming language is known as the 'language of the web'?",
        "option_a": "Python",
        "option_b": "Java",
        "option_c": "JavaScript",
        "option_d": "C++",
        "correct_option": "C",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Computer Science",
        "topic": "Programming Languages"
    },
    {
        "question_text": "What is the time complexity of binary search algorithm?",
        "option_a": "O(n)",
        "option_b": "O(log n)",
        "option_c": "O(n²)",
        "option_d": "O(1)",
        "correct_option": "B",
        "marks": 2,
        "difficulty": "medium",
        "subject": "Computer Science",
        "topic": "Algorithms"
    },
    {
        "question_text": "Which data structure uses LIFO (Last In First Out) principle?",
        "option_a": "Queue",
        "option_b": "Stack",
        "option_c": "Array",
        "option_d": "Linked List",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Computer Science",
        "topic": "Data Structures"
    },
    {
        "question_text": "What does SQL stand for?",
        "option_a": "Structured Query Language",
        "option_b": "Simple Query Language",
        "option_c": "System Query Language",
        "option_d": "Standard Query Language",
        "correct_option": "A",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Computer Science",
        "topic": "Databases"
    },
    
    # Mathematics Questions
    {
        "question_text": "What is the value of π (pi) approximately?",
        "option_a": "3.14",
        "option_b": "2.71",
        "option_c": "1.41",
        "option_d": "1.73",
        "correct_option": "A",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Mathematics",
        "topic": "Constants"
    },
    {
        "question_text": "What is the derivative of x²?",
        "option_a": "x",
        "option_b": "2x",
        "option_c": "x²",
        "option_d": "2x²",
        "correct_option": "B",
        "marks": 2,
        "difficulty": "medium",
        "subject": "Mathematics",
        "topic": "Calculus"
    },
    {
        "question_text": "If a² + b² = c², which theorem does this represent?",
        "option_a": "Fermat's Theorem",
        "option_b": "Euler's Theorem",
        "option_c": "Pythagorean Theorem",
        "option_d": "Newton's Theorem",
        "correct_option": "C",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Mathematics",
        "topic": "Geometry"
    },
    {
        "question_text": "What is the sum of angles in a triangle?",
        "option_a": "90 degrees",
        "option_b": "180 degrees",
        "option_c": "270 degrees",
        "option_d": "360 degrees",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Mathematics",
        "topic": "Geometry"
    },
    {
        "question_text": "What is the value of log₁₀(100)?",
        "option_a": "1",
        "option_b": "2",
        "option_c": "10",
        "option_d": "100",
        "correct_option": "B",
        "marks": 2,
        "difficulty": "medium",
        "subject": "Mathematics",
        "topic": "Logarithms"
    },
    
    # Physics Questions
    {
        "question_text": "What is the SI unit of force?",
        "option_a": "Joule",
        "option_b": "Newton",
        "option_c": "Watt",
        "option_d": "Pascal",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Physics",
        "topic": "Units and Measurements"
    },
    {
        "question_text": "What is the speed of light in vacuum?",
        "option_a": "3 × 10⁸ m/s",
        "option_b": "3 × 10⁶ m/s",
        "option_c": "3 × 10⁷ m/s",
        "option_d": "3 × 10⁹ m/s",
        "correct_option": "A",
        "marks": 1,
        "difficulty": "medium",
        "subject": "Physics",
        "topic": "Light"
    },
    {
        "question_text": "Who formulated the laws of motion?",
        "option_a": "Albert Einstein",
        "option_b": "Isaac Newton",
        "option_c": "Galileo Galilei",
        "option_d": "Stephen Hawking",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Physics",
        "topic": "Classical Mechanics"
    },
    {
        "question_text": "What is the formula for kinetic energy?",
        "option_a": "mgh",
        "option_b": "½mv²",
        "option_c": "mv",
        "option_d": "ma",
        "correct_option": "B",
        "marks": 2,
        "difficulty": "medium",
        "subject": "Physics",
        "topic": "Energy"
    },
    {
        "question_text": "What phenomenon explains the bending of light?",
        "option_a": "Reflection",
        "option_b": "Diffraction",
        "option_c": "Refraction",
        "option_d": "Dispersion",
        "correct_option": "C",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Physics",
        "topic": "Optics"
    },
    
    # Chemistry Questions
    {
        "question_text": "What is the chemical symbol for Gold?",
        "option_a": "Go",
        "option_b": "Gd",
        "option_c": "Au",
        "option_d": "Ag",
        "correct_option": "C",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Chemistry",
        "topic": "Periodic Table"
    },
    {
        "question_text": "What is the pH of a neutral solution?",
        "option_a": "0",
        "option_b": "7",
        "option_c": "14",
        "option_d": "10",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Chemistry",
        "topic": "Acids and Bases"
    },
    {
        "question_text": "What is the atomic number of Carbon?",
        "option_a": "4",
        "option_b": "6",
        "option_c": "8",
        "option_d": "12",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Chemistry",
        "topic": "Atomic Structure"
    },
    {
        "question_text": "Which gas is most abundant in Earth's atmosphere?",
        "option_a": "Oxygen",
        "option_b": "Carbon Dioxide",
        "option_c": "Nitrogen",
        "option_d": "Hydrogen",
        "correct_option": "C",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Chemistry",
        "topic": "Atmospheric Chemistry"
    },
    {
        "question_text": "What type of bond involves sharing of electrons?",
        "option_a": "Ionic Bond",
        "option_b": "Covalent Bond",
        "option_c": "Metallic Bond",
        "option_d": "Hydrogen Bond",
        "correct_option": "B",
        "marks": 2,
        "difficulty": "medium",
        "subject": "Chemistry",
        "topic": "Chemical Bonding"
    },
    
    # General Knowledge Questions
    {
        "question_text": "What is the capital of India?",
        "option_a": "Mumbai",
        "option_b": "New Delhi",
        "option_c": "Kolkata",
        "option_d": "Chennai",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "easy",
        "subject": "General Knowledge",
        "topic": "Geography"
    },
    {
        "question_text": "Who is known as the Father of the Nation in India?",
        "option_a": "Jawaharlal Nehru",
        "option_b": "Subhas Chandra Bose",
        "option_c": "Mahatma Gandhi",
        "option_d": "Sardar Patel",
        "correct_option": "C",
        "marks": 1,
        "difficulty": "easy",
        "subject": "General Knowledge",
        "topic": "History"
    },
    {
        "question_text": "Which planet is known as the Red Planet?",
        "option_a": "Venus",
        "option_b": "Mars",
        "option_c": "Jupiter",
        "option_d": "Saturn",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "easy",
        "subject": "General Knowledge",
        "topic": "Astronomy"
    },
    {
        "question_text": "In which year did India gain independence?",
        "option_a": "1942",
        "option_b": "1945",
        "option_c": "1947",
        "option_d": "1950",
        "correct_option": "C",
        "marks": 1,
        "difficulty": "easy",
        "subject": "General Knowledge",
        "topic": "Indian History"
    },
    {
        "question_text": "What is the currency of Japan?",
        "option_a": "Yuan",
        "option_b": "Won",
        "option_c": "Yen",
        "option_d": "Ringgit",
        "correct_option": "C",
        "marks": 1,
        "difficulty": "easy",
        "subject": "General Knowledge",
        "topic": "Economics"
    },
]

def seed_questions():
    """Add sample questions to database"""
    
    # Check if admin user exists (we'll use user_id=1 as creator)
    admin = db.query(models.User).filter(models.User.id == 1).first()
    if not admin:
        print("⚠️  Warning: Admin user (ID=1) not found. Creating questions without creator.")
        creator_id = None
    else:
        creator_id = admin.id
    
    created_count = 0
    skipped_count = 0
    
    print("🚀 Starting to seed questions...")
    print("-" * 60)
    
    for idx, q_data in enumerate(SAMPLE_QUESTIONS, 1):
        # Check if similar question already exists
        existing = db.query(models.QuestionBank).filter(
            models.QuestionBank.question_text == q_data["question_text"]
        ).first()
        
        if existing:
            print(f"⏭️  Question {idx}: Already exists - '{q_data['question_text'][:50]}...'")
            skipped_count += 1
            continue
        
        # Create new question
        question = models.QuestionBank(
            question_type="mcq_single",
            question_text=q_data["question_text"],
            option_a=q_data["option_a"],
            option_b=q_data["option_b"],
            option_c=q_data["option_c"],
            option_d=q_data["option_d"],
            correct_option=q_data["correct_option"],
            marks=q_data["marks"],
            difficulty=q_data["difficulty"],
            subject=q_data["subject"],
            topic=q_data["topic"],
            version=1,
            is_active=True,
            approval_status="approved",
            created_by_id=creator_id,
        )
        
        db.add(question)
        db.flush()
        
        # Generate QB UID
        subject_abbr = ''.join(filter(str.isalpha, q_data["subject"]))[:2].upper()
        question.qb_uid = f"{str(question.id).zfill(2)}{subject_abbr}"
        
        print(f"✅ Question {idx}: Created - {q_data['subject']} - '{q_data['question_text'][:50]}...'")
        created_count += 1
    
    # Commit all changes
    db.commit()
    
    print("-" * 60)
    print(f"✅ Successfully created {created_count} questions")
    print(f"⏭️  Skipped {skipped_count} existing questions")
    print(f"📊 Total in database: {db.query(models.QuestionBank).count()} questions")
    print("-" * 60)
    
    # Show breakdown by subject
    print("\n📚 Questions by Subject:")
    subjects = db.query(models.QuestionBank.subject).distinct().all()
    for (subject,) in subjects:
        if subject:
            count = db.query(models.QuestionBank).filter(models.QuestionBank.subject == subject).count()
            print(f"   • {subject}: {count} questions")
    
    print("\n✨ Done! You can now use these questions in your exams.")

if __name__ == "__main__":
    try:
        seed_questions()
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
    finally:
        db.close()
