const { MongoClient } = require("mongodb");

const url = "mongodb://127.0.0.1:27017";
const dbName = "Bida";

async function main() {
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db(dbName);

    // 1. Fix existing data
    console.log("Fixing existing invalid data...");

    // Courses: price cannot be negative
    const coursesResult = await db.collection("courses").updateMany(
      { price: { $lt: 0 } },
      { $set: { price: 0 } }
    );
    console.log(`Fixed ${coursesResult.modifiedCount} courses with negative price.`);

    // Courses: duration_hours cannot be negative
    const durationResult = await db.collection("courses").updateMany(
      { duration_hours: { $lt: 0 } },
      { $set: { duration_hours: 0 } }
    );
    console.log(`Fixed ${durationResult.modifiedCount} courses with negative duration.`);

    // Enrollments: progress_percent must be between 0 and 100
    const progressFixResult = await db.collection("enrollments").updateMany(
      { progress_percent: { $lt: 0 } },
      { $set: { progress_percent: 0 } }
    );
    const progressFixMaxResult = await db.collection("enrollments").updateMany(
        { progress_percent: { $gt: 100 } },
        { $set: { progress_percent: 100 } }
      );
    console.log(`Fixed ${progressFixResult.modifiedCount + progressFixMaxResult.modifiedCount} enrollments with invalid progress.`);

    // Payments: amount must be positive
    const paymentsResult = await db.collection("payments").updateMany(
        { amount: { $lt: 0 } },
        { $set: { amount: 0 } }
    );
    console.log(`Fixed ${paymentsResult.modifiedCount} payments with negative amount.`);


    // 2. Apply Schema Validation
    console.log("Applying Schema Validation...");

    // Validate Courses
    await db.command({
      collMod: "courses",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["title", "price"],
          properties: {
            title: {
              bsonType: "string",
              description: "must be a string and is required"
            },
            price: {
              bsonType: ["double", "int", "decimal"],
              minimum: 0,
              description: "must be a non-negative number"
            },
            duration_hours: {
              bsonType: ["double", "int", "decimal"],
              minimum: 0,
              description: "must be a non-negative number"
            },
            rating: {
                bsonType: ["double", "int", "decimal"],
                minimum: 0,
                maximum: 5,
                description: "must be between 0 and 5"
            }
          }
        }
      },
      validationLevel: "strict",
      validationAction: "error"
    });
    console.log("Validation applied to 'courses'");

    // Validate Enrollments
    await db.command({
        collMod: "enrollments",
        validator: {
          $jsonSchema: {
            bsonType: "object",
            properties: {
              progress_percent: {
                bsonType: ["double", "int", "decimal"],
                minimum: 0,
                maximum: 100,
                description: "must be between 0 and 100"
              },
              final_grade: {
                bsonType: ["double", "int", "decimal", "null"],
                minimum: 0,
                maximum: 100,
                description: "must be between 0 and 100 if present"
              }
            }
          }
        },
        validationLevel: "strict",
        validationAction: "error"
      });
      console.log("Validation applied to 'enrollments'");

      // Validate Payments
      await db.command({
        collMod: "payments",
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["amount"],
            properties: {
              amount: {
                bsonType: ["double", "int", "decimal"],
                minimum: 0,
                description: "amount must be positive"
              }
            }
          }
        },
        validationLevel: "strict",
        validationAction: "error"
      });
      console.log("Validation applied to 'payments'");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

main();
