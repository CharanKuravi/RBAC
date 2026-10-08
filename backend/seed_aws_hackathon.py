"""
Seed AWS Hackathon Quiz questions into the question bank.
25 Questions: 20 AWS Scenarios + 5 Aptitude Questions
"""

from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# AWS Hackathon Quiz - All 25 Questions with Answers
AWS_HACKATHON_QUESTIONS = [
    # PART A — AWS SCENARIO QUESTIONS (1-20)
    {
        "question_text": "Exam Day Rush: A college website gets very busy during exam results. What should automatically add more EC2 servers?",
        "option_a": "S3",
        "option_b": "Auto Scaling",
        "option_c": "RDS",
        "option_d": "IAM",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "easy",
        "subject": "AWS Cloud",
        "topic": "Auto Scaling"
    },
    {
        "question_text": "Store Project Files: Students need to upload PDFs and project files and access them later. Which service fits best?",
        "option_a": "S3",
        "option_b": "RDS",
        "option_c": "Lambda",
        "option_d": "CloudWatch",
        "correct_option": "A",
        "marks": 1,
        "difficulty": "easy",
        "subject": "AWS Cloud",
        "topic": "Storage Services"
    },
    {
        "question_text": "Student Database: A college needs to store organized student and registration records. Which service should they use?",
        "option_a": "S3",
        "option_b": "RDS",
        "option_c": "Route 53",
        "option_d": "Lambda",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "easy",
        "subject": "AWS Cloud",
        "topic": "Database Services"
    },
    {
        "question_text": "Private Environment: A team wants its cloud resources inside its own controlled private environment. Which service helps?",
        "option_a": "IAM",
        "option_b": "VPC",
        "option_c": "S3",
        "option_d": "CloudWatch",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "medium",
        "subject": "AWS Cloud",
        "topic": "Networking"
    },
    {
        "question_text": "Different Permissions: Two students need different levels of access to AWS resources. Which service should manage this?",
        "option_a": "IAM",
        "option_b": "EC2",
        "option_c": "Route 53",
        "option_d": "RDS",
        "correct_option": "A",
        "marks": 1,
        "difficulty": "easy",
        "subject": "AWS Cloud",
        "topic": "Security & Access"
    },
    {
        "question_text": "Small Triggered Task: A small task should run only when needed and stop after finishing. Which service is suitable?",
        "option_a": "EC2",
        "option_b": "Lambda",
        "option_c": "S3",
        "option_d": "RDS",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "medium",
        "subject": "AWS Cloud",
        "topic": "Serverless Computing"
    },
    {
        "question_text": "Website Name: Students use results.college.com to reach an application. Which service directs them to the right destination?",
        "option_a": "Route 53",
        "option_b": "S3",
        "option_c": "IAM",
        "option_d": "Lambda",
        "correct_option": "A",
        "marks": 1,
        "difficulty": "easy",
        "subject": "AWS Cloud",
        "topic": "DNS Services"
    },
    {
        "question_text": "Something Looks Wrong: Developers want to monitor their application and receive alerts when something is wrong. Which service should they use?",
        "option_a": "RDS",
        "option_b": "CloudWatch",
        "option_c": "S3",
        "option_d": "Route 53",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "easy",
        "subject": "AWS Cloud",
        "topic": "Monitoring"
    },
    {
        "question_text": "Rent a Computer: A team needs a cloud computer to run its application. Which service provides this?",
        "option_a": "EC2",
        "option_b": "S3",
        "option_c": "IAM",
        "option_d": "RDS",
        "correct_option": "A",
        "marks": 1,
        "difficulty": "easy",
        "subject": "AWS Cloud",
        "topic": "Compute Services"
    },
    {
        "question_text": "Traffic Falls Back: A website adds extra EC2 servers during heavy traffic. Later, traffic becomes normal. What should happen to the extra servers?",
        "option_a": "They should remain forever",
        "option_b": "They should be reduced",
        "option_c": "They should become S3 storage",
        "option_d": "They should become RDS",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "medium",
        "subject": "AWS Cloud",
        "topic": "Auto Scaling"
    },
    {
        "question_text": "Find the Missing Service: A team has EC2, S3 and RDS. They also want to know when the application starts behaving badly. What is missing?",
        "option_a": "CloudWatch",
        "option_b": "Route 53",
        "option_c": "Lambda",
        "option_d": "IAM",
        "correct_option": "A",
        "marks": 1,
        "difficulty": "medium",
        "subject": "AWS Cloud",
        "topic": "Monitoring"
    },
    {
        "question_text": "Files + Records: An application needs both uploaded files and organized student records. Which pair is most suitable?",
        "option_a": "S3 + RDS",
        "option_b": "EC2 + IAM",
        "option_c": "Lambda + Route 53",
        "option_d": "VPC + CloudWatch",
        "correct_option": "A",
        "marks": 2,
        "difficulty": "medium",
        "subject": "AWS Cloud",
        "topic": "Service Combinations"
    },
    {
        "question_text": "Monitoring vs Scaling: CloudWatch shows that an EC2 server is overloaded. Which service can help provide more EC2 capacity?",
        "option_a": "S3",
        "option_b": "Auto Scaling",
        "option_c": "RDS",
        "option_d": "Route 53",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "medium",
        "subject": "AWS Cloud",
        "topic": "Auto Scaling"
    },
    {
        "question_text": "No Unnecessary Access: A student only needs access to project files. Should they receive access to every AWS resource?",
        "option_a": "Yes, always",
        "option_b": "No, give only required access",
        "option_c": "Yes, during exams",
        "option_d": "Only if CloudWatch allows it",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "easy",
        "subject": "AWS Cloud",
        "topic": "Security Best Practices"
    },
    {
        "question_text": "Which One Is Unnecessary? An application needs EC2, S3, RDS and CloudWatch. It has no small triggered tasks. Which service is NOT needed for that stated requirement?",
        "option_a": "Lambda",
        "option_b": "S3",
        "option_c": "RDS",
        "option_d": "EC2",
        "correct_option": "A",
        "marks": 1,
        "difficulty": "medium",
        "subject": "AWS Cloud",
        "topic": "Service Selection"
    },
    {
        "question_text": "Simple Architecture: A college app needs computing, file storage and a database. Which combination is the best match?",
        "option_a": "EC2 + S3 + RDS",
        "option_b": "IAM + Route 53 + CloudWatch",
        "option_c": "Lambda + VPC + S3",
        "option_d": "Route 53 + IAM + RDS",
        "correct_option": "A",
        "marks": 2,
        "difficulty": "medium",
        "subject": "AWS Cloud",
        "topic": "Architecture Design"
    },
    {
        "question_text": "Website Becomes Slow: Traffic suddenly increases and one EC2 server becomes slow. Which service should help handle the changing server capacity?",
        "option_a": "Auto Scaling",
        "option_b": "S3",
        "option_c": "IAM",
        "option_d": "RDS",
        "correct_option": "A",
        "marks": 1,
        "difficulty": "easy",
        "subject": "AWS Cloud",
        "topic": "Auto Scaling"
    },
    {
        "question_text": "Choose the Correct Pair: Which pair is correctly matched?",
        "option_a": "S3 → files",
        "option_b": "Route 53 → database",
        "option_c": "IAM → file storage",
        "option_d": "RDS → website name",
        "correct_option": "A",
        "marks": 1,
        "difficulty": "easy",
        "subject": "AWS Cloud",
        "topic": "Service Mapping"
    },
    {
        "question_text": "Two Requirements: A team needs a website name and wants to monitor the application. Which two services fit?",
        "option_a": "Route 53 + CloudWatch",
        "option_b": "S3 + RDS",
        "option_c": "EC2 + Lambda",
        "option_d": "IAM + VPC",
        "correct_option": "A",
        "marks": 2,
        "difficulty": "medium",
        "subject": "AWS Cloud",
        "topic": "Service Combinations"
    },
    {
        "question_text": "Final Scenario: A hackathon app needs application computing, uploaded files, student records, access control and monitoring. Which set fits best?",
        "option_a": "EC2 + S3 + RDS + IAM + CloudWatch",
        "option_b": "S3 + Route 53 only",
        "option_c": "Lambda + RDS only",
        "option_d": "IAM + Route 53 only",
        "correct_option": "A",
        "marks": 2,
        "difficulty": "hard",
        "subject": "AWS Cloud",
        "topic": "Complete Architecture"
    },
    
    # PART B — APTITUDE QUESTIONS (21-25)
    {
        "question_text": "Number Pattern: What comes next? 3, 6, 12, 24, ___",
        "option_a": "36",
        "option_b": "42",
        "option_c": "48",
        "option_d": "54",
        "correct_option": "C",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Aptitude",
        "topic": "Number Series"
    },
    {
        "question_text": "Work & Time: A student solves 10 questions in 20 minutes. At the same rate, how many questions can be solved in 1 hour?",
        "option_a": "20",
        "option_b": "25",
        "option_c": "30",
        "option_d": "40",
        "correct_option": "C",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Aptitude",
        "topic": "Time and Work"
    },
    {
        "question_text": "Percentage: A quiz has 40 questions. A student answers 32 correctly. What is the score percentage?",
        "option_a": "70%",
        "option_b": "75%",
        "option_c": "80%",
        "option_d": "85%",
        "correct_option": "C",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Aptitude",
        "topic": "Percentage"
    },
    {
        "question_text": "Ratio: The ratio of students in Team A to Team B is 2:3. If Team A has 20 students, how many are in Team B?",
        "option_a": "25",
        "option_b": "30",
        "option_c": "35",
        "option_d": "40",
        "correct_option": "B",
        "marks": 1,
        "difficulty": "easy",
        "subject": "Aptitude",
        "topic": "Ratio and Proportion"
    },
    {
        "question_text": "Simple Logic: Five students P, Q, R, S and T stand in a line. P is before Q, Q is before R, and T is after R. Which student must be before R?",
        "option_a": "Only P",
        "option_b": "Only Q",
        "option_c": "P and Q",
        "option_d": "S and T",
        "correct_option": "C",
        "marks": 1,
        "difficulty": "medium",
        "subject": "Aptitude",
        "topic": "Logical Reasoning"
    },
]

def seed_aws_hackathon_questions():
    """Add AWS Hackathon Quiz questions to database"""
    
    # Check if admin user exists
    admin = db.query(models.User).filter(models.User.id == 1).first()
    creator_id = admin.id if admin else None
    
    created_count = 0
    skipped_count = 0
    
    print("🚀 Starting to seed AWS Hackathon Quiz questions...")
    print("=" * 70)
    
    for idx, q_data in enumerate(AWS_HACKATHON_QUESTIONS, 1):
        # Check if question already exists
        existing = db.query(models.QuestionBank).filter(
            models.QuestionBank.question_text == q_data["question_text"]
        ).first()
        
        if existing:
            print(f"⏭️  Q{idx}: Already exists - '{q_data['question_text'][:60]}...'")
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
        subject_abbr = 'AWS' if q_data["subject"] == "AWS Cloud" else 'APT'
        question.qb_uid = f"{str(question.id).zfill(3)}{subject_abbr}"
        
        print(f"✅ Q{idx}: [{q_data['correct_option']}] {q_data['subject']:12} - {q_data['question_text'][:55]}...")
        created_count += 1
    
    # Commit all changes
    db.commit()
    
    print("=" * 70)
    print(f"\n📊 SUMMARY:")
    print(f"   ✅ Successfully created: {created_count} questions")
    print(f"   ⏭️  Skipped existing: {skipped_count} questions")
    print(f"   📚 Total in database: {db.query(models.QuestionBank).count()} questions")
    print("=" * 70)
    
    # Show breakdown
    print(f"\n🎯 AWS Hackathon Quiz Breakdown:")
    aws_count = db.query(models.QuestionBank).filter(
        models.QuestionBank.subject == "AWS Cloud"
    ).count()
    apt_count = db.query(models.QuestionBank).filter(
        models.QuestionBank.subject == "Aptitude"
    ).count()
    
    print(f"   • AWS Cloud Questions: {aws_count}")
    print(f"   • Aptitude Questions: {apt_count}")
    
    print(f"\n✨ AWS Hackathon Quiz questions are ready!")
    print(f"   You can now create a test paper with these questions.")

if __name__ == "__main__":
    try:
        seed_aws_hackathon_questions()
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()
