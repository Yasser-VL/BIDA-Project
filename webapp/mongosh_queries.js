// ============================================
// BIDA QUERY LAB - MONGOSH SCRIPT
// ============================================
// Run this script using: mongosh Bida mongosh_queries.js

// Helper to print headers
function printHeader(title) {
    print("\n" + "=".repeat(50));
    print(" " + title.toUpperCase());
    print("=".repeat(50));
}

// ============================================
// A. CRUD COMPLET
// ============================================

printHeader("A. CRUD COMPLET");

// 1. AJOUTER UN NOUVEAU COURS
print("\n> 1. Ajouter un nouveau cours");
const newCourse = {
    title: "Introduction to MongoDB Shell",
    description: "Master the mongo shell commands",
    category_id: db.categories.findOne()._id,
    instructor_id: db.instructors.findOne()._id,
    price: 49.99,
    duration_hours: 5,
    created_at: new Date(),
    tags: ["mongodb", "shell", "cli"],
    rating: 0
};
const insertRes = db.courses.insertOne(newCourse);
print("Result:", insertRes);

// 2. TROUVER TOUS LES COURS D'UNE CATÉGORIE
print("\n> 2. Trouver tous les cours d'une catégorie (ex: Design)");
const category = db.categories.findOne({ name: "Design" }) || db.categories.findOne();
const courses = db.courses.find({ category_id: category._id }, { title: 1, price: 1 }).limit(5).toArray();
print("Category:", category.name);
printjson(courses);

// 3. METTRE À JOUR LE PRIX D'UN COURS
print("\n> 3. Mettre à jour le prix d'un cours");
const courseToUpdate = db.courses.findOne();
print("Before:", courseToUpdate.price);
const updateRes = db.courses.updateOne(
    { _id: courseToUpdate._id },
    { $set: { price: 89.99 } }
);
print("Update Result:", updateRes);
print("After:", db.courses.findOne({ _id: courseToUpdate._id }).price);

// 4. SUPPRIMER LES ÉTUDIANTS INACTIFS
print("\n> 4. Supprimer les étudiants inactifs");
const deleteRes = db.students.deleteMany({ status: "inactive" });
print("Deleted Count:", deleteRes.deletedCount);


// ============================================
// B. REQUÊTES AVANCÉES
// ============================================

printHeader("B. REQUÊTES AVANCÉES");

// 1. TROUVER LES 5 COURS LES MIEUX NOTÉS
print("\n> 1. Trouver les 5 cours les mieux notés");
const topCourses = db.courses.find({}, { title: 1, rating: 1 }).sort({ rating: -1 }).limit(5).toArray();
printjson(topCourses);

// 2. LISTER LES ÉTUDIANTS PAR PAYS
print("\n> 2. Lister les étudiants par pays (Top 5)");
const studentsByCountry = db.students.aggregate([
    { $group: { _id: "$country", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
]).toArray();
printjson(studentsByCountry);

// 3. COMPTER LES INSCRIPTIONS PAR STATUT
print("\n> 3. Compter les inscriptions par statut");
const enrollmentStats = db.enrollments.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
]).toArray();
printjson(enrollmentStats);

// 4. CALCULER LE REVENU TOTAL
print("\n> 4. Calculer le revenu total");
const revenue = db.payments.aggregate([
    { $group: { _id: null, total: { $sum: "$amount" } } }
]).toArray();
printjson(revenue);


// ============================================
// C. JOINTURES ET AGRÉGATIONS
// ============================================

printHeader("C. JOINTURES ET AGRÉGATIONS");

// 1. JOINTURE COURS-INSCRIPTIONS-ÉTUDIANTS
print("\n> 1. Jointure cours-inscriptions-étudiants");
const fullJoin = db.enrollments.aggregate([
    { $limit: 1 }, // Limit for readability
    {
        $lookup: {
            from: "students",
            localField: "student_id",
            foreignField: "_id",
            as: "student"
        }
    },
    { $unwind: "$student" },
    {
        $lookup: {
            from: "courses",
            localField: "course_id",
            foreignField: "_id",
            as: "course"
        }
    },
    { $unwind: "$course" },
    {
        $project: {
            _id: 1,
            "student.name": 1,
            "course.title": 1,
            status: 1
        }
    }
]).toArray();
printjson(fullJoin);

// 2. STATISTIQUES PAR CATÉGORIE DE COURS
print("\n> 2. Statistiques par catégorie de cours");
const catStats = db.courses.aggregate([
    {
        $lookup: {
            from: "categories",
            localField: "category_id",
            foreignField: "_id",
            as: "category"
        }
    },
    { $unwind: "$category" },
    {
        $group: {
            _id: "$category.name",
            total_courses: { $sum: 1 },
            avg_price: { $avg: "$price" },
            avg_rating: { $avg: "$rating" }
        }
    },
    { $sort: { total_courses: -1 } }
]).toArray();
printjson(catStats);

// 3. PERFORMANCE MOYENNE DES ÉTUDIANTS
print("\n> 3. Performance moyenne des étudiants");
const studentPerf = db.enrollments.aggregate([
    { $match: { status: "completed", final_grade: { $ne: null } } },
    {
        $lookup: {
            from: "students",
            localField: "student_id",
            foreignField: "_id",
            as: "student"
        }
    },
    { $unwind: "$student" },
    {
        $group: {
            _id: "$student.name",
            courses_completed: { $sum: 1 },
            avg_grade: { $avg: "$final_grade" }
        }
    },
    { $sort: { avg_grade: -1 } },
    { $limit: 5 }
]).toArray();
printjson(studentPerf);

// 4. ÉVOLUTION DES INSCRIPTIONS DANS LE TEMPS
print("\n> 4. Évolution des inscriptions dans le temps");
const trends = db.enrollments.aggregate([
    {
        $project: {
            year_month: { $dateToString: { format: "%Y-%m", date: "$enrolled_at" } }
        }
    },
    { $group: { _id: "$year_month", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: 10 }
]).toArray();
printjson(trends);

print("\n" + "=".repeat(50));
print(" SUCCÈS : TOUTES LES REQUÊTES ONT ÉTÉ EXÉCUTÉES");
print("=".repeat(50));
