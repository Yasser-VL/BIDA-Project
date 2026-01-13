# generate_data.py
import os
import random
from datetime import datetime, timedelta
from bson import ObjectId, json_util

# --- File output path ---
BASE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'exported_extended_json')
os.makedirs(BASE_DIR, exist_ok=True)

# --- Helper functions ---
def oid():
    return ObjectId()

def random_date(days_back=730):
    return datetime.utcnow() - timedelta(days=random.randint(0, days_back))

def write_collection(filename, arr):
    path = os.path.join(BASE_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        for doc in arr:
            f.write(json_util.dumps(doc) + '\n')
    print(f"Wrote {len(arr)} documents to {path}")

# --- Configurable sizes ---
NUM_CATEGORIES = 8
NUM_INSTRUCTORS = 15
NUM_STUDENTS = 500
NUM_COURSES = 80
NUM_ENROLLMENTS = 1400
NUM_REVIEWS = 900
NUM_PAYMENTS = 1200

# --- 1) Categories ---
categories = []
category_data = [
    {"name": "Programming", "description": "Software development and coding"},
    {"name": "Data Science", "description": "Analytics, ML, and AI"},
    {"name": "Business", "description": "Management and entrepreneurship"},
    {"name": "Design", "description": "UI/UX and graphic design"},
    {"name": "DevOps", "description": "Infrastructure and deployment"},
    {"name": "Mathematics", "description": "Pure and applied mathematics"},
    {"name": "Languages", "description": "Foreign language learning"},
    {"name": "Personal Development", "description": "Self-improvement and productivity"}
]

for cat_data in category_data[:NUM_CATEGORIES]:
    categories.append({
        "_id": oid(),
        "name": cat_data["name"],
        "description": cat_data["description"]
    })

# --- 2) Instructors ---
instructors = []
instructor_data = [
    {"name": "Dr. Sarah Johnson", "bio": "Former Google engineer with 15 years of experience in software architecture", "specialty": "Programming", "country": "United States"},
    {"name": "Prof. Michael Chen", "bio": "PhD in Machine Learning from MIT, published researcher in AI", "specialty": "Data Science", "country": "Canada"},
    {"name": "Emily Rodriguez", "bio": "Award-winning UX designer, worked with Fortune 500 companies", "specialty": "Design", "country": "Spain"},
    {"name": "David Kim", "bio": "Certified AWS Solutions Architect and DevOps consultant", "specialty": "DevOps", "country": "South Korea"},
    {"name": "Dr. Amanda Williams", "bio": "Mathematics professor with a passion for making complex concepts simple", "specialty": "Mathematics", "country": "United Kingdom"},
    {"name": "Carlos Martinez", "bio": "Serial entrepreneur and business strategist with 3 successful exits", "specialty": "Business", "country": "Mexico"},
    {"name": "Sophie Laurent", "bio": "Polyglot speaker of 7 languages, certified language instructor", "specialty": "Languages", "country": "France"},
    {"name": "James Anderson", "bio": "Life coach and productivity expert, bestselling author", "specialty": "Personal Development", "country": "Australia"},
    {"name": "Dr. Priya Patel", "bio": "Data scientist at Microsoft, specializing in deep learning", "specialty": "Data Science", "country": "India"},
    {"name": "Robert Taylor", "bio": "Full-stack developer and open-source contributor", "specialty": "Programming", "country": "United States"},
    {"name": "Lisa Zhang", "bio": "Brand strategist and digital marketing expert", "specialty": "Business", "country": "Singapore"},
    {"name": "Marco Rossi", "bio": "Creative director with expertise in motion graphics", "specialty": "Design", "country": "Italy"},
    {"name": "Anna Kowalski", "bio": "Cloud infrastructure specialist, Kubernetes expert", "specialty": "DevOps", "country": "Poland"},
    {"name": "Hassan Ahmed", "bio": "Applied mathematics researcher focusing on optimization", "specialty": "Mathematics", "country": "Egypt"},
    {"name": "Nina Petrov", "bio": "Mindfulness coach and personal transformation specialist", "specialty": "Personal Development", "country": "Russia"}
]

for instr_data in instructor_data[:NUM_INSTRUCTORS]:
    instructors.append({
        "_id": oid(),
        "name": instr_data["name"],
        "email": instr_data["name"].lower().replace(" ", ".").replace("dr.", "").replace("prof.", "") + "@eduplatform.com",
        "bio": instr_data["bio"],
        "specialty": instr_data["specialty"],
        "country": instr_data["country"],
        "rating": round(random.uniform(4.2, 5.0), 2),
        "total_students": random.randint(500, 5000)
    })

# --- 3) Students ---
students = []
first_names = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William",
               "Mia", "James", "Charlotte", "Benjamin", "Amelia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander"]
last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
              "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
countries = ["United States", "Canada", "United Kingdom", "Germany", "France", "Spain", "Italy", "Australia", 
             "Japan", "South Korea", "India", "Brazil", "Mexico", "Netherlands", "Sweden"]

for _ in range(NUM_STUDENTS):
    first = random.choice(first_names)
    last = random.choice(last_names)
    name = f"{first} {last}"
    students.append({
        "_id": oid(),
        "name": name,
        "email": f"{first.lower()}.{last.lower()}{random.randint(1, 999)}@email.com",
        "country": random.choice(countries),
        "registered_at": random_date(365*3),
        "status": random.choices(["active", "inactive"], weights=(0.92, 0.08))[0],
        "age": random.randint(18, 65)
    })

# --- 4) Courses ---
courses = []
course_templates = {
    "Programming": [
        ("Python for Beginners", "Learn Python programming from scratch with hands-on projects", ["Python", "Beginner", "Programming"], 29.99, 20),
        ("Advanced JavaScript", "Master modern JavaScript including ES6+, async/await, and frameworks", ["JavaScript", "Advanced", "Web"], 49.99, 35),
        ("Full-Stack Web Development", "Build complete web applications using React, Node.js, and MongoDB", ["Full-Stack", "React", "Node.js"], 99.99, 60),
        ("Java Masterclass", "Comprehensive Java programming from basics to advanced OOP concepts", ["Java", "OOP", "Enterprise"], 79.99, 45),
        ("C++ Game Development", "Create games using C++ and Unreal Engine", ["C++", "Game Dev", "Unreal"], 89.99, 50),
    ],
    "Data Science": [
        ("Data Analysis with Python", "Analyze data using Pandas, NumPy, and visualization libraries", ["Python", "Pandas", "Analysis"], 59.99, 30),
        ("Machine Learning A-Z", "Complete machine learning course covering all major algorithms", ["ML", "Scikit-learn", "AI"], 99.99, 55),
        ("Deep Learning Specialization", "Neural networks, CNNs, RNNs, and transformers with TensorFlow", ["Deep Learning", "TensorFlow", "Neural Networks"], 149.99, 70),
        ("Data Visualization Mastery", "Create stunning visualizations with Tableau and D3.js", ["Tableau", "D3.js", "Visualization"], 49.99, 25),
        ("Big Data with Spark", "Process large datasets using Apache Spark and Hadoop", ["Spark", "Big Data", "Hadoop"], 79.99, 40),
    ],
    "Business": [
        ("Digital Marketing Fundamentals", "Master SEO, social media, and content marketing strategies", ["Marketing", "SEO", "Social Media"], 39.99, 20),
        ("Project Management Professional", "PMP certification prep and agile methodologies", ["PMP", "Agile", "Scrum"], 69.99, 35),
        ("Financial Analysis & Modeling", "Excel-based financial modeling for business decisions", ["Finance", "Excel", "Modeling"], 79.99, 30),
        ("Entrepreneurship Bootcamp", "Start and scale your business from idea to execution", ["Startup", "Business", "Strategy"], 99.99, 40),
        ("Leadership & Management", "Develop essential leadership skills for modern managers", ["Leadership", "Management", "Skills"], 49.99, 25),
    ],
    "Design": [
        ("UI/UX Design Complete Course", "Design beautiful and user-friendly interfaces", ["UI", "UX", "Figma"], 69.99, 35),
        ("Graphic Design Masterclass", "Adobe Creative Suite mastery: Photoshop, Illustrator, InDesign", ["Photoshop", "Illustrator", "Design"], 79.99, 40),
        ("Motion Graphics with After Effects", "Create stunning animations and motion graphics", ["After Effects", "Animation", "Motion"], 59.99, 30),
        ("Web Design Fundamentals", "HTML, CSS, and responsive design principles", ["HTML", "CSS", "Responsive"], 39.99, 20),
        ("3D Modeling with Blender", "Create 3D models and animations using Blender", ["Blender", "3D", "Modeling"], 69.99, 45),
    ],
    "DevOps": [
        ("Docker & Kubernetes Mastery", "Containerization and orchestration for modern applications", ["Docker", "Kubernetes", "Containers"], 89.99, 35),
        ("AWS Solutions Architect", "Design and deploy scalable solutions on AWS", ["AWS", "Cloud", "Architecture"], 99.99, 45),
        ("CI/CD Pipeline Automation", "Automate your deployment with Jenkins, GitLab CI, and GitHub Actions", ["CI/CD", "Jenkins", "Automation"], 69.99, 30),
        ("Infrastructure as Code", "Terraform and Ansible for infrastructure automation", ["Terraform", "Ansible", "IaC"], 79.99, 35),
        ("Linux System Administration", "Master Linux for servers and DevOps workflows", ["Linux", "Admin", "Server"], 59.99, 30),
    ],
    "Mathematics": [
        ("Calculus I: Limits and Derivatives", "Foundational calculus concepts with real-world applications", ["Calculus", "Math", "Derivatives"], 49.99, 30),
        ("Linear Algebra for Data Science", "Matrices, vectors, and eigenvalues for ML applications", ["Linear Algebra", "Math", "Data Science"], 59.99, 25),
        ("Statistics & Probability", "Statistical analysis and probability theory fundamentals", ["Statistics", "Probability", "Analysis"], 49.99, 28),
        ("Discrete Mathematics", "Logic, sets, graphs, and combinatorics", ["Discrete Math", "Logic", "Graphs"], 39.99, 25),
        ("Applied Mathematics", "Mathematical modeling for engineering and science", ["Applied Math", "Modeling", "Engineering"], 69.99, 35),
    ],
    "Languages": [
        ("Spanish for Beginners", "Learn conversational Spanish from zero to intermediate", ["Spanish", "Beginner", "Conversation"], 29.99, 25),
        ("Business English Mastery", "Professional English for international business", ["English", "Business", "Professional"], 39.99, 20),
        ("French Language Complete Course", "Comprehensive French from basics to advanced", ["French", "Complete", "Fluency"], 49.99, 40),
        ("Mandarin Chinese Fundamentals", "Learn Mandarin with focus on speaking and characters", ["Mandarin", "Chinese", "Speaking"], 59.99, 35),
        ("German for Travelers", "Essential German for travel and everyday situations", ["German", "Travel", "Conversation"], 29.99, 15),
    ],
    "Personal Development": [
        ("Time Management Mastery", "Boost productivity and achieve work-life balance", ["Productivity", "Time Management", "Efficiency"], 19.99, 10),
        ("Public Speaking Confidence", "Overcome fear and deliver powerful presentations", ["Public Speaking", "Communication", "Confidence"], 39.99, 15),
        ("Emotional Intelligence", "Develop EQ for better relationships and leadership", ["EQ", "Emotional Intelligence", "Leadership"], 29.99, 12),
        ("Mindfulness & Meditation", "Reduce stress and increase focus through mindfulness", ["Mindfulness", "Meditation", "Wellness"], 24.99, 10),
        ("Career Development Strategy", "Plan and accelerate your professional growth", ["Career", "Development", "Strategy"], 34.99, 15),
    ]
}

for category in categories:
    cat_name = category["name"]
    if cat_name in course_templates:
        # Get instructors who specialize in this category
        category_instructors = [i for i in instructors if i.get("specialty") == cat_name]
        if not category_instructors:
            category_instructors = instructors  # Fallback to all instructors
        
        templates = course_templates[cat_name]
        for title, desc, tags, price, duration in templates:
            instr = random.choice(category_instructors)
            courses.append({
                "_id": oid(),
                "title": title,
                "description": desc,
                "category_id": category["_id"],
                "instructor_id": instr["_id"],
                "price": price,
                "duration_hours": duration,
                "created_at": random_date(365*2),
                "tags": tags,
                "rating": round(random.uniform(3.8, 5.0), 2),
                "enrolled_count": random.randint(50, 2000),
                "level": random.choice(["Beginner", "Intermediate", "Advanced"])
            })

# Fill remaining courses with variations
while len(courses) < NUM_COURSES:
    cat = random.choice(categories)
    instr = random.choice([i for i in instructors if i.get("specialty") == cat["name"]] or instructors)
    cat_name = cat["name"]
    
    # Create variation of existing course
    if cat_name in course_templates and course_templates[cat_name]:
        base = random.choice(course_templates[cat_name])
        title = f"{base[0]} - Advanced Edition"
        desc = f"Advanced version: {base[1]}"
        tags = base[2]
        price = base[3] * 1.5
        duration = base[4] * 1.2
    else:
        title = f"Complete {cat_name} Course"
        desc = f"Comprehensive course covering all aspects of {cat_name}"
        tags = [cat_name, "Complete", "Certification"]
        price = random.choice([49.99, 69.99, 89.99])
        duration = random.randint(20, 50)
    
    courses.append({
        "_id": oid(),
        "title": title,
        "description": desc,
        "category_id": cat["_id"],
        "instructor_id": instr["_id"],
        "price": round(price, 2),
        "duration_hours": round(duration, 1),
        "created_at": random_date(365*2),
        "tags": tags,
        "rating": round(random.uniform(3.5, 5.0), 2),
        "enrolled_count": random.randint(20, 1500),
        "level": random.choice(["Beginner", "Intermediate", "Advanced"])
    })

# --- 5) Enrollments ---
enrollments = []
for _ in range(NUM_ENROLLMENTS):
    student = random.choice(students)
    course = random.choice(courses)
    status = random.choices(["in_progress", "completed", "dropped"], weights=(0.55, 0.40, 0.05))[0]
    
    if status == "completed":
        progress = 100
        final_grade = round(random.uniform(65, 100), 1)
    elif status == "in_progress":
        progress = random.randint(10, 95)
        final_grade = None
    else:  # dropped
        progress = random.randint(5, 40)
        final_grade = None
    
    enrollments.append({
        "_id": oid(),
        "student_id": student["_id"],
        "course_id": course["_id"],
        "enrolled_at": random_date(365*2),
        "status": status,
        "progress_percent": progress,
        "final_grade": final_grade,
        "last_accessed": random_date(30) if status == "in_progress" else None
    })

# --- 6) Reviews ---
reviews = []
review_comments = {
    5: [
        "Absolutely fantastic course! Learned so much and the instructor was amazing.",
        "Best course I've ever taken. Highly recommend to everyone!",
        "Exceeded all my expectations. Worth every penny!",
        "The instructor explains complex topics in such a clear way. 10/10!",
        "This course changed my career. Thank you!"
    ],
    4: [
        "Great course overall. A few sections could be improved but very solid.",
        "Really enjoyed this course. Good balance of theory and practice.",
        "Excellent content, though I wish there were more hands-on projects.",
        "Very informative and well-structured. Would recommend!",
        "Good course with practical examples. Learned a lot."
    ],
    3: [
        "Decent course but nothing exceptional. Gets the job done.",
        "Some good content but felt a bit rushed in places.",
        "Average course. Expected more depth on certain topics.",
        "It's okay. Some parts were great, others not so much.",
        "Useful information but presentation could be better."
    ],
    2: [
        "Disappointed. The course didn't cover what was advertised.",
        "Too basic for the price. Expected more advanced content.",
        "Outdated information and poor audio quality.",
        "Not worth the money. Better free resources available.",
        "Struggled to stay engaged. Needs major improvements."
    ],
    1: [
        "Complete waste of time and money. Very disappointing.",
        "Terrible course. Instructor seems unprepared.",
        "Do not buy this course. Save your money.",
        "Extremely poor quality. Requesting a refund.",
        "Worst course I've ever purchased. Avoid at all costs."
    ]
}

for _ in range(NUM_REVIEWS):
    r_student = random.choice(students)
    r_course = random.choice(courses)
    rating = random.choices([5, 4, 3, 2, 1], weights=[0.50, 0.30, 0.12, 0.05, 0.03])[0]
    comment = random.choice(review_comments[rating])
    
    reviews.append({
        "_id": oid(),
        "course_id": r_course["_id"],
        "student_id": r_student["_id"],
        "rating": rating,
        "comment": comment,
        "created_at": random_date(365*2),
        "helpful_count": random.randint(0, 50) if rating >= 4 else random.randint(0, 10)
    })

# --- 7) Payments ---
payments = []
for _ in range(NUM_PAYMENTS):
    student = random.choice(students)
    course = random.choice(courses)
    amount = course["price"]
    
    # Skip some free courses
    if amount == 0 and random.random() < 0.9:
        continue
    
    # Apply occasional discounts
    if random.random() < 0.15:
        amount = round(amount * random.choice([0.5, 0.7, 0.8]), 2)
    
    payments.append({
        "_id": oid(),
        "student_id": student["_id"],
        "course_id": course["_id"],
        "amount": amount,
        "currency": "USD",
        "paid_at": random_date(365*2),
        "payment_method": random.choice(["credit_card", "paypal", "debit_card", "bank_transfer"]),
        "status": random.choices(["completed", "pending", "failed"], weights=[0.95, 0.03, 0.02])[0],
        "transaction_id": f"TXN-{random.randint(100000, 999999)}"
    })

# --- Write all collections to files ---
write_collection('categories.json', categories)
write_collection('instructors.json', instructors)
write_collection('students.json', students)
write_collection('courses.json', courses)
write_collection('enrollments.json', enrollments)
write_collection('reviews.json', reviews)
write_collection('payments.json', payments)

print("✅ All JSON files generated with realistic educational data in:", BASE_DIR)
