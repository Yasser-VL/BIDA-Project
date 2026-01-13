const { MongoClient, ObjectId } = require("mongodb");
const url = "mongodb://127.0.0.1:27017";
const dbName = "Bida";

async function run() {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    console.log("Connected to Bida.");

    // 1. agg-course-join
    console.log("\n--- Testing agg-course-join (Enrollments -> Students, Courses) ---");
    try {
        const res = await db.collection("enrollments").aggregate([
            { $limit: 10 },
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
            { $unwind: "$course" }
        ]).toArray();
        console.log(`Result count: ${res.length}`);

        if (res.length === 0) {
            console.log(">>> DIAGNOSIS for agg-course-join:");
            const sampleEnrollment = await db.collection("enrollments").findOne();
            console.log("Sample Enrollment:", sampleEnrollment);
            if (sampleEnrollment) {
                console.log(`Checking student_id: ${sampleEnrollment.student_id} (Type: ${typeof sampleEnrollment.student_id})`);
                const student = await db.collection("students").findOne({ _id: sampleEnrollment.student_id });
                console.log("Matching Student via findOne({_id: enrollment.student_id}):", student ? "FOUND" : "NOT FOUND");

                if (!student) {
                    const anyStudent = await db.collection("students").findOne();
                    console.log("Any Student _id sample:", anyStudent._id);
                    console.log("Type comparison -> Enrollment student_id constructor:", sampleEnrollment.student_id.constructor.name);
                    console.log("Type comparison -> Student _id constructor:", anyStudent._id.constructor.name);
                }
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }

    // 2. agg-category-stats
    console.log("\n--- Testing agg-category-stats (Courses -> Categories) ---");
    try {
        const res = await db.collection("courses").aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "category_id",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            { $limit: 5 }
        ]).toArray();
        console.log(`Result count: ${res.length}`);

        if (res.length === 0) {
            console.log(">>> DIAGNOSIS for agg-category-stats:");
            const course = await db.collection("courses").findOne();
            console.log("Sample Course:", course);
            if (course) {
                const category = await db.collection("categories").findOne({ _id: course.category_id });
                console.log("Matching Category via findOne:", category ? "FOUND" : "NOT FOUND");
            }
        }
    } catch (e) { console.error(e); }

    // 3. agg-student-performance
    console.log("\n--- Testing agg-student-performance ---");
    try {
        const res = await db.collection("enrollments").aggregate([
            { $match: { status: "completed", final_grade: { $ne: null } } },
            { $lookup: { from: "students", localField: "student_id", foreignField: "_id", as: "student" } },
            { $unwind: "$student" },
            { $limit: 5 }
        ]).toArray();
        console.log(`Result count: ${res.length}`);
    } catch (e) { console.error(e); }

    // 4. agg-enrollment-trends
    console.log("\n--- Testing agg-enrollment-trends ---");
    try {
        const res = await db.collection("enrollments").aggregate([
            { $project: { year_month: { $dateToString: { format: "%Y-%m", date: "$enrolled_at" } } } },
            { $limit: 5 }
        ]).toArray();
        console.log(`Result sample (first 5):`, res);

        const sample = await db.collection("enrollments").findOne();
        console.log("Sample enrolled_at type:", sample && sample.enrolled_at ? sample.enrolled_at.constructor.name : "N/A");

    } catch (e) { console.error(e); }

    client.close();
}
run();
