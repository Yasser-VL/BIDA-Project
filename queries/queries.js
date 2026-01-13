// ============================================
// MINI PROJET N°3 - MongoDB Queries
// Plateforme Éducative en Ligne
// ============================================

// Database connection
use Bida;

// ============================================
// A. CRUD COMPLET
// ============================================

// 1. Ajouter un nouveau cours
db.courses.insertOne({
    title: "Advanced Machine Learning with Python",
    description: "Master advanced ML algorithms and deep learning techniques",
    category_id: ObjectId("674f8e1a2b3c4d5e6f7a8b9c"), // Replace with actual category_id
    instructor_id: ObjectId("674f8e1a2b3c4d5e6f7a8b9d"), // Replace with actual instructor_id
    price: 149.99,
    duration_hours: 45.5,
    created_at: new Date(),
    tags: ["machine-learning", "python", "AI", "deep-learning"],
    rating: 0
});

// 2. Trouver tous les cours d'une catégorie
db.courses.find({
    category_id: ObjectId("674f8e1a2b3c4d5e6f7a8b9c") // Replace with actual category_id
}).pretty();

// Alternative: Trouver tous les cours de "Programming"
db.courses.aggregate([
    {
        $lookup: {
            from: "categories",
            localField: "category_id",
            foreignField: "_id",
            as: "category"
        }
    },
    { $unwind: "$category" },
    { $match: { "category.name": "Programming" } },
    {
        $project: {
            title: 1,
            price: 1,
            rating: 1,
            category_name: "$category.name"
        }
    }
]);

// 3. Mettre à jour le prix d'un cours
db.courses.updateOne(
    { _id: ObjectId("674f8e1a2b3c4d5e6f7a8b9e") }, // Replace with actual course_id
    { $set: { price: 99.99 } }
);

// Alternative: Mettre à jour plusieurs cours avec une réduction de 20%
db.courses.updateMany(
    { category_id: ObjectId("674f8e1a2b3c4d5e6f7a8b9c") },
    { $mul: { price: 0.8 } }
);

// 4. Supprimer les étudiants inactifs
db.students.deleteMany({
    status: "inactive"
});

// Vérifier le nombre d'étudiants supprimés
db.students.countDocuments({ status: "inactive" });

// ============================================
// B. REQUÊTES AVANCÉES (Filtres, Tri, Projection)
// ============================================

// 1. Trouver les 5 cours les mieux notés
db.courses.find(
    {},
    {
        _id: 1,
        title: 1,
        rating: 1,
        price: 1,
        duration_hours: 1
    }
)
    .sort({ rating: -1 })
    .limit(5);

// Version avec détails de l'instructeur
db.courses.aggregate([
    { $sort: { rating: -1 } },
    { $limit: 5 },
    {
        $lookup: {
            from: "instructors",
            localField: "instructor_id",
            foreignField: "_id",
            as: "instructor"
        }
    },
    { $unwind: "$instructor" },
    {
        $project: {
            title: 1,
            rating: 1,
            price: 1,
            instructor_name: "$instructor.name",
            instructor_email: "$instructor.email"
        }
    }
]);

// 2. Lister les étudiants par pays
db.students.aggregate([
    {
        $group: {
            _id: "$country",
            students: { $push: { name: "$name", email: "$email", status: "$status" } },
            count: { $sum: 1 }
        }
    },
    { $sort: { count: -1 } }
]);

// Version simplifiée avec projection
db.students.find(
    {},
    { name: 1, email: 1, country: 1, status: 1 }
).sort({ country: 1, name: 1 });

// 3. Compter les inscriptions par statut
db.enrollments.aggregate([
    {
        $group: {
            _id: "$status",
            count: { $sum: 1 },
            avg_progress: { $avg: "$progress_percent" }
        }
    },
    { $sort: { count: -1 } }
]);

// Version détaillée avec pourcentages
db.enrollments.aggregate([
    {
        $facet: {
            total: [{ $count: "count" }],
            by_status: [
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]
        }
    },
    {
        $project: {
            total: { $arrayElemAt: ["$total.count", 0] },
            by_status: 1
        }
    },
    { $unwind: "$by_status" },
    {
        $project: {
            status: "$by_status._id",
            count: "$by_status.count",
            percentage: {
                $multiply: [
                    { $divide: ["$by_status.count", "$total"] },
                    100
                ]
            }
        }
    }
]);

// 4. Calculer le revenu total
db.payments.aggregate([
    {
        $group: {
            _id: null,
            total_revenue: { $sum: "$amount" },
            total_transactions: { $sum: 1 },
            avg_transaction: { $avg: "$amount" }
        }
    }
]);

// Revenu total par méthode de paiement
db.payments.aggregate([
    {
        $group: {
            _id: "$payment_method",
            revenue: { $sum: "$amount" },
            transactions: { $sum: 1 }
        }
    },
    { $sort: { revenue: -1 } }
]);

// Revenu total par cours
db.payments.aggregate([
    {
        $group: {
            _id: "$course_id",
            revenue: { $sum: "$amount" },
            enrollments: { $sum: 1 }
        }
    },
    {
        $lookup: {
            from: "courses",
            localField: "_id",
            foreignField: "_id",
            as: "course"
        }
    },
    { $unwind: "$course" },
    {
        $project: {
            course_title: "$course.title",
            revenue: 1,
            enrollments: 1
        }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
]);

// ============================================
// C. JOINTURES ET AGRÉGATIONS
// ============================================

// 1. Jointure cours-inscriptions-étudiants
db.enrollments.aggregate([
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
        $lookup: {
            from: "instructors",
            localField: "course.instructor_id",
            foreignField: "_id",
            as: "instructor"
        }
    },
    { $unwind: "$instructor" },
    {
        $project: {
            student_name: "$student.name",
            student_email: "$student.email",
            student_country: "$student.country",
            course_title: "$course.title",
            course_price: "$course.price",
            instructor_name: "$instructor.name",
            enrollment_status: "$status",
            progress: "$progress_percent",
            final_grade: "$final_grade",
            enrolled_at: "$enrolled_at"
        }
    },
    { $limit: 20 }
]);

// 2. Statistiques par catégorie de cours
db.courses.aggregate([
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
        $lookup: {
            from: "enrollments",
            localField: "_id",
            foreignField: "course_id",
            as: "enrollments"
        }
    },
    {
        $lookup: {
            from: "payments",
            localField: "_id",
            foreignField: "course_id",
            as: "payments"
        }
    },
    {
        $group: {
            _id: "$category.name",
            total_courses: { $sum: 1 },
            avg_price: { $avg: "$price" },
            avg_rating: { $avg: "$rating" },
            avg_duration: { $avg: "$duration_hours" },
            total_enrollments: { $sum: { $size: "$enrollments" } },
            total_revenue: { $sum: { $sum: "$payments.amount" } }
        }
    },
    { $sort: { total_revenue: -1 } }
]);

// 3. Performance moyenne des étudiants
db.enrollments.aggregate([
    {
        $match: {
            status: "completed",
            final_grade: { $ne: null }
        }
    },
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
            _id: "$student_id",
            student_name: { $first: "$student.name" },
            student_email: { $first: "$student.email" },
            student_country: { $first: "$student.country" },
            courses_completed: { $sum: 1 },
            avg_grade: { $avg: "$final_grade" },
            min_grade: { $min: "$final_grade" },
            max_grade: { $max: "$final_grade" }
        }
    },
    { $sort: { avg_grade: -1 } },
    { $limit: 20 }
]);

// Performance globale par pays
db.enrollments.aggregate([
    {
        $match: {
            status: "completed",
            final_grade: { $ne: null }
        }
    },
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
            _id: "$student.country",
            students_count: { $addToSet: "$student_id" },
            avg_grade: { $avg: "$final_grade" },
            courses_completed: { $sum: 1 }
        }
    },
    {
        $project: {
            country: "$_id",
            unique_students: { $size: "$students_count" },
            avg_grade: 1,
            courses_completed: 1
        }
    },
    { $sort: { avg_grade: -1 } }
]);

// 4. Évolution des inscriptions dans le temps
db.enrollments.aggregate([
    {
        $project: {
            year: { $year: "$enrolled_at" },
            month: { $month: "$enrolled_at" },
            status: 1
        }
    },
    {
        $group: {
            _id: {
                year: "$year",
                month: "$month"
            },
            total_enrollments: { $sum: 1 },
            completed: {
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
            },
            in_progress: {
                $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
            },
            dropped: {
                $sum: { $cond: [{ $eq: ["$status", "dropped"] }, 1, 0] }
            }
        }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
]);

// Évolution mensuelle avec taux de complétion
db.enrollments.aggregate([
    {
        $project: {
            year_month: {
                $dateToString: { format: "%Y-%m", date: "$enrolled_at" }
            },
            status: 1
        }
    },
    {
        $group: {
            _id: "$year_month",
            total: { $sum: 1 },
            completed: {
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
            }
        }
    },
    {
        $project: {
            month: "$_id",
            total: 1,
            completed: 1,
            completion_rate: {
                $multiply: [
                    { $divide: ["$completed", "$total"] },
                    100
                ]
            }
        }
    },
    { $sort: { month: 1 } }
]);

// ============================================
// REQUÊTES BONUS - Analyses Avancées
// ============================================

// 1. Cours les plus populaires avec détails complets
db.courses.aggregate([
    {
        $lookup: {
            from: "enrollments",
            localField: "_id",
            foreignField: "course_id",
            as: "enrollments"
        }
    },
    {
        $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "course_id",
            as: "reviews"
        }
    },
    {
        $lookup: {
            from: "instructors",
            localField: "instructor_id",
            foreignField: "_id",
            as: "instructor"
        }
    },
    { $unwind: "$instructor" },
    {
        $project: {
            title: 1,
            price: 1,
            rating: 1,
            instructor_name: "$instructor.name",
            total_enrollments: { $size: "$enrollments" },
            total_reviews: { $size: "$reviews" },
            avg_review_rating: { $avg: "$reviews.rating" },
            revenue_potential: {
                $multiply: ["$price", { $size: "$enrollments" }]
            }
        }
    },
    { $sort: { total_enrollments: -1 } },
    { $limit: 10 }
]);

// 2. Analyse de rétention des étudiants
db.students.aggregate([
    {
        $lookup: {
            from: "enrollments",
            localField: "_id",
            foreignField: "student_id",
            as: "enrollments"
        }
    },
    {
        $project: {
            name: 1,
            email: 1,
            country: 1,
            status: 1,
            total_enrollments: { $size: "$enrollments" },
            completed_courses: {
                $size: {
                    $filter: {
                        input: "$enrollments",
                        as: "enrollment",
                        cond: { $eq: ["$$enrollment.status", "completed"] }
                    }
                }
            },
            dropped_courses: {
                $size: {
                    $filter: {
                        input: "$enrollments",
                        as: "enrollment",
                        cond: { $eq: ["$$enrollment.status", "dropped"] }
                    }
                }
            }
        }
    },
    {
        $project: {
            name: 1,
            email: 1,
            country: 1,
            status: 1,
            total_enrollments: 1,
            completed_courses: 1,
            dropped_courses: 1,
            completion_rate: {
                $cond: [
                    { $eq: ["$total_enrollments", 0] },
                    0,
                    {
                        $multiply: [
                            { $divide: ["$completed_courses", "$total_enrollments"] },
                            100
                        ]
                    }
                ]
            }
        }
    },
    { $sort: { completion_rate: -1 } }
]);

// 3. ROI par instructeur
db.instructors.aggregate([
    {
        $lookup: {
            from: "courses",
            localField: "_id",
            foreignField: "instructor_id",
            as: "courses"
        }
    },
    {
        $unwind: {
            path: "$courses",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $lookup: {
            from: "payments",
            localField: "courses._id",
            foreignField: "course_id",
            as: "payments"
        }
    },
    {
        $group: {
            _id: "$_id",
            name: { $first: "$name" },
            email: { $first: "$email" },
            total_courses: { $sum: 1 },
            total_revenue: { $sum: { $sum: "$payments.amount" } },
            avg_course_rating: { $avg: "$courses.rating" }
        }
    },
    { $sort: { total_revenue: -1 } }
]);

// ============================================
// INDEX RECOMMENDATIONS
// ============================================

// Créer des index pour optimiser les performances
db.courses.createIndex({ category_id: 1 });
db.courses.createIndex({ rating: -1 });
db.courses.createIndex({ price: 1 });
db.enrollments.createIndex({ student_id: 1, course_id: 1 });
db.enrollments.createIndex({ status: 1 });
db.enrollments.createIndex({ enrolled_at: -1 });
db.students.createIndex({ status: 1 });
db.students.createIndex({ country: 1 });
db.payments.createIndex({ course_id: 1 });
db.payments.createIndex({ student_id: 1 });
db.payments.createIndex({ paid_at: -1 });

// ============================================
// FIN DU FICHIER
// ============================================
