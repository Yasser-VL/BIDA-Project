const { MongoClient } = require("mongodb");

const url = "mongodb://127.0.0.1:27017";
const dbName = "Bida";

(async () => {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    console.log("--- Checking Enrollments ---");
    const enrollment = await db.collection("enrollments").findOne();
    console.log("Enrollment Sample:", enrollment);
    if (enrollment) {
        console.log("Type of student_id:", typeof enrollment.student_id);
        console.log("Constructor of student_id:", enrollment.student_id ? enrollment.student_id.constructor.name : "N/A");
        console.log("Type of course_id:", typeof enrollment.course_id);
        console.log("Type of enrolled_at:", typeof enrollment.enrolled_at);
        console.log("Constructor of enrolled_at:", enrollment.enrolled_at ? enrollment.enrolled_at.constructor.name : "N/A");
    }

    console.log("\n--- Checking Students ---");
    const student = await db.collection("students").findOne();
    console.log("Student Sample:", student);
    if (student) {
        console.log("Type of _id:", typeof student._id);
        console.log("Constructor of _id:", student._id ? student._id.constructor.name : "N/A");
    }

    console.log("\n--- Checking Categories ---");
    const category = await db.collection("categories").findOne();
    console.log("Category Sample:", category);
    if (category) {
        console.log("Type of _id:", typeof category._id);
    }

    console.log("\n--- Checking Courses ---");
    const course = await db.collection("courses").findOne();
    console.log("Course Sample:", course);
    if (course) {
        console.log("Type of category_id:", typeof course.category_id);
    }

    await client.close();
})();
