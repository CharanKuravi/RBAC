"""
Seeds 3 sample question papers: DSA, Java, Cloud Theory.
Run: python3 seed_papers.py
"""
from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

PAPERS = [
    {
        "title": "Data Structures and Algorithms",
        "subject": "DSA",
        "duration_minutes": 60,
        "total_marks": 20,
        "questions": [
            {
                "question_text": "What is the time complexity of binary search on a sorted array of n elements?",
                "option_a": "O(n)", "option_b": "O(log n)", "option_c": "O(n log n)", "option_d": "O(1)",
                "correct_option": "B", "marks": 2,
            },
            {
                "question_text": "Which data structure uses LIFO (Last In First Out) order?",
                "option_a": "Queue", "option_b": "Linked List", "option_c": "Stack", "option_d": "Tree",
                "correct_option": "C", "marks": 2,
            },
            {
                "question_text": "What is the worst-case time complexity of QuickSort?",
                "option_a": "O(n log n)", "option_b": "O(n)", "option_c": "O(n^2)", "option_d": "O(log n)",
                "correct_option": "C", "marks": 2,
            },
            {
                "question_text": "Which traversal of a Binary Search Tree gives elements in sorted order?",
                "option_a": "Pre-order", "option_b": "Post-order", "option_c": "Level-order", "option_d": "In-order",
                "correct_option": "D", "marks": 2,
            },
            {
                "question_text": "What is the space complexity of Merge Sort?",
                "option_a": "O(1)", "option_b": "O(log n)", "option_c": "O(n)", "option_d": "O(n^2)",
                "correct_option": "C", "marks": 2,
            },
            {
                "question_text": "In a min-heap, the root element is always:",
                "option_a": "The largest element", "option_b": "The smallest element",
                "option_c": "A random element", "option_d": "The median element",
                "correct_option": "B", "marks": 2,
            },
            {
                "question_text": "Which algorithm is used to find the shortest path in a weighted graph?",
                "option_a": "BFS", "option_b": "DFS", "option_c": "Dijkstra", "option_d": "Kruskal",
                "correct_option": "C", "marks": 2,
            },
            {
                "question_text": "What is the time complexity of inserting an element into a hash table on average?",
                "option_a": "O(n)", "option_b": "O(log n)", "option_c": "O(n log n)", "option_d": "O(1)",
                "correct_option": "D", "marks": 2,
            },
            {
                "question_text": "Which of the following is NOT a stable sorting algorithm?",
                "option_a": "Merge Sort", "option_b": "Bubble Sort", "option_c": "Quick Sort", "option_d": "Insertion Sort",
                "correct_option": "C", "marks": 2,
            },
            {
                "question_text": "A graph with no cycles is called a:",
                "option_a": "Complete graph", "option_b": "Bipartite graph", "option_c": "Tree", "option_d": "Directed graph",
                "correct_option": "C", "marks": 2,
            },
        ],
    },
    {
        "title": "Java Programming Fundamentals",
        "subject": "Java",
        "duration_minutes": 60,
        "total_marks": 20,
        "questions": [
            {
                "question_text": "Which keyword is used to prevent a class from being subclassed in Java?",
                "option_a": "static", "option_b": "abstract", "option_c": "final", "option_d": "private",
                "correct_option": "C", "marks": 2,
            },
            {
                "question_text": "What is the default value of an int variable in Java?",
                "option_a": "null", "option_b": "1", "option_c": "undefined", "option_d": "0",
                "correct_option": "D", "marks": 2,
            },
            {
                "question_text": "Which of the following is NOT a feature of Java?",
                "option_a": "Platform independence", "option_b": "Pointers", "option_c": "Object-oriented", "option_d": "Multithreading",
                "correct_option": "B", "marks": 2,
            },
            {
                "question_text": "What does JVM stand for?",
                "option_a": "Java Variable Machine", "option_b": "Java Virtual Machine",
                "option_c": "Java Verified Module", "option_d": "Java Visual Manager",
                "correct_option": "B", "marks": 2,
            },
            {
                "question_text": "Which interface must be implemented to create a thread in Java?",
                "option_a": "Serializable", "option_b": "Cloneable", "option_c": "Runnable", "option_d": "Comparable",
                "correct_option": "C", "marks": 2,
            },
            {
                "question_text": "What is the output of: System.out.println(10 / 3) in Java?",
                "option_a": "3.33", "option_b": "3", "option_c": "4", "option_d": "3.0",
                "correct_option": "B", "marks": 2,
            },
            {
                "question_text": "Which collection class allows duplicate elements and maintains insertion order?",
                "option_a": "HashSet", "option_b": "TreeSet", "option_c": "HashMap", "option_d": "ArrayList",
                "correct_option": "D", "marks": 2,
            },
            {
                "question_text": "What is method overloading in Java?",
                "option_a": "A method calling itself", "option_b": "Multiple methods with same name but different parameters",
                "option_c": "Overriding a parent class method", "option_d": "A method with no return type",
                "correct_option": "B", "marks": 2,
            },
            {
                "question_text": "Which exception is thrown when dividing by zero in Java?",
                "option_a": "NullPointerException", "option_b": "ArrayIndexOutOfBoundsException",
                "option_c": "ArithmeticException", "option_d": "NumberFormatException",
                "correct_option": "C", "marks": 2,
            },
            {
                "question_text": "What is the use of the 'super' keyword in Java?",
                "option_a": "To call a static method", "option_b": "To refer to the current class instance",
                "option_c": "To refer to the parent class", "option_d": "To create a new object",
                "correct_option": "C", "marks": 2,
            },
        ],
    },
    {
        "title": "Cloud Computing Theory",
        "subject": "Cloud Computing",
        "duration_minutes": 60,
        "total_marks": 20,
        "questions": [
            {
                "question_text": "Which cloud service model provides virtualized computing resources over the internet?",
                "option_a": "SaaS", "option_b": "PaaS", "option_c": "IaaS", "option_d": "FaaS",
                "correct_option": "C", "marks": 2,
            },
            {
                "question_text": "What does AWS stand for?",
                "option_a": "Advanced Web Services", "option_b": "Amazon Web Services",
                "option_c": "Automated Workflow System", "option_d": "Application Web Stack",
                "correct_option": "B", "marks": 2,
            },
            {
                "question_text": "Which type of cloud is exclusively used by a single organization?",
                "option_a": "Public Cloud", "option_b": "Hybrid Cloud", "option_c": "Community Cloud", "option_d": "Private Cloud",
                "correct_option": "D", "marks": 2,
            },
            {
                "question_text": "What is the primary benefit of auto-scaling in cloud computing?",
                "option_a": "Reduces security risks", "option_b": "Automatically adjusts resources based on demand",
                "option_c": "Provides permanent storage", "option_d": "Encrypts all data",
                "correct_option": "B", "marks": 2,
            },
            {
                "question_text": "Which of the following is an example of SaaS?",
                "option_a": "Amazon EC2", "option_b": "Google App Engine", "option_c": "Microsoft Azure VMs", "option_d": "Google Workspace",
                "correct_option": "D", "marks": 2,
            },
            {
                "question_text": "What is a CDN (Content Delivery Network) primarily used for?",
                "option_a": "Database management", "option_b": "Delivering content faster by using geographically distributed servers",
                "option_c": "Encrypting network traffic", "option_d": "Managing virtual machines",
                "correct_option": "B", "marks": 2,
            },
            {
                "question_text": "Which cloud deployment model combines public and private clouds?",
                "option_a": "Community Cloud", "option_b": "Multi Cloud", "option_c": "Hybrid Cloud", "option_d": "Distributed Cloud",
                "correct_option": "C", "marks": 2,
            },
            {
                "question_text": "What does the term 'elasticity' mean in cloud computing?",
                "option_a": "Data backup capability", "option_b": "Ability to scale resources up or down dynamically",
                "option_c": "Network speed optimization", "option_d": "Security compliance",
                "correct_option": "B", "marks": 2,
            },
            {
                "question_text": "Which protocol is most commonly used for cloud storage access?",
                "option_a": "FTP", "option_b": "SMTP", "option_c": "REST/HTTP", "option_d": "SSH",
                "correct_option": "C", "marks": 2,
            },
            {
                "question_text": "What is a 'serverless' architecture in cloud computing?",
                "option_a": "A system with no physical servers", "option_b": "Running applications without managing server infrastructure",
                "option_c": "A cloud with no internet connection", "option_d": "A private data center",
                "correct_option": "B", "marks": 2,
            },
        ],
    },
]


def seed():
    for paper_data in PAPERS:
        existing = db.query(models.QuestionPaper).filter(
            models.QuestionPaper.title == paper_data["title"]
        ).first()
        if existing:
            print(f"Paper already exists: {paper_data['title']} (Set ID: {existing.id})")
            continue

        paper = models.QuestionPaper(
            title=paper_data["title"],
            subject=paper_data["subject"],
            duration_minutes=paper_data["duration_minutes"],
            total_marks=paper_data["total_marks"],
        )
        db.add(paper)
        db.flush()

        for idx, q in enumerate(paper_data["questions"]):
            question = models.Question(
                paper_id=paper.id,
                question_text=q["question_text"],
                option_a=q["option_a"],
                option_b=q["option_b"],
                option_c=q["option_c"],
                option_d=q["option_d"],
                correct_option=q["correct_option"],
                marks=q["marks"],
                order_index=idx,
            )
            db.add(question)

        db.commit()
        print(f"Created: {paper_data['title']} — Set ID: {paper.id} ({len(paper_data['questions'])} questions)")


seed()
db.close()
print("Done.")
