const express = require("express");
const app = express();
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const path = require("path");
const { spawn } = require("child_process");
const vm = require("vm");

const url = "mongodb://127.0.0.1:27017";
const dbName = "Bida";
let db;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

MongoClient.connect(url)
  .then(client => {
    db = client.db(dbName);
    console.log("✅ Connected to MongoDB");
    app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ============================================
// TERMINAL PAGE
// ============================================

app.get("/terminal", (req, res) => {
  res.render("terminal", { page: "terminal" });
});

// ============================================
// MONGODB TUTORIAL PAGE
// ============================================

app.get("/mongodb-tutorial", (req, res) => {
  res.render("mongodb-tutorial", { page: "mongodb-tutorial" });
});

// ============================================
// PROJECT DOCUMENTATION PAGE
// ============================================

app.get("/project-documentation", (req, res) => {
  res.render("project-documentation", { page: "project-documentation" });
});

// ============================================
// DATA GENERATOR GUIDE PAGE
// ============================================

app.get("/data-generator", (req, res) => {
  res.render("data-generator", { page: "data-generator" });
});

// ============================================
// QUIZ PAGE
// ============================================

app.get("/quiz", (req, res) => {
  res.render("quiz", { page: "quiz" });
});

// ============================================
// EXECUTE SHELL COMMAND API
// ============================================

const BLOCKED_COMMANDS = [
  'rm -rf', 'del /f', 'format', 'shutdown', 'reboot',
  'mkfs', 'dd if=', ':(){', 'chmod -R 777 /', 'mv /* ',
  'wget', 'curl.*\\|.*sh', 'powershell.*-enc', 'reg delete'
];

app.post("/api/execute-command", async (req, res) => {
  try {
    const { command, cwd } = req.body;

    if (!command || typeof command !== 'string') {
      return res.json({ success: false, error: "No command provided" });
    }

    const trimmedCmd = command.trim();

    // ==========================================
    // MONGODB SHELL SIMULATION
    // ==========================================

    // 1. Handle "mongosh" entry
    if (trimmedCmd === 'mongosh') {
      return res.json({
        success: true,
        output: `\x1b[32m🍃 MongoDB Shell Simulation Active\x1b[0m\r\n` +
          `Connected to: \x1b[36m${url}/${dbName}\x1b[0m\r\n\r\n` +
          `\x1b[33mAvailable MongoDB commands:\x1b[0m\r\n` +
          `  \x1b[32mshow dbs\x1b[0m            List all databases\r\n` +
          `  \x1b[32mshow collections\x1b[0m    List collections\r\n` +
          `  \x1b[32muse <dbname>\x1b[0m        Switch database (simulated)\r\n` +
          `  \x1b[32mdb.<col>.find()\x1b[0m     Query documents\r\n` +
          `  \x1b[32mdb.<col>.count()\x1b[0m    Count documents\r\n`,
        cwd: cwd || process.cwd()
      });
    }

    // 2. Handle "show dbs" / "show databases"
    if (trimmedCmd === 'show dbs' || trimmedCmd === 'show databases') {
      try {
        const adminDb = db.admin();
        const result = await adminDb.listDatabases();
        let output = '\x1b[1madmin\x1b[0m   0.000GB\n\x1b[1mlocal\x1b[0m   0.000GB\n'; // Mock standard system dbs if hidden

        // Format actual dbs
        result.databases.forEach(d => {
          const sizeGB = (d.sizeOnDisk / (1024 * 1024 * 1024)).toFixed(3);
          output += `\x1b[1m${d.name.padEnd(8)}\x1b[0m ${sizeGB}GB\n`;
        });

        return res.json({ success: true, output: output.trim(), cwd });
      } catch (e) {
        return res.json({ success: false, error: "Error listing databases: " + e.message });
      }
    }

    // 3. Handle "show collections" / "show tables"
    if (trimmedCmd === 'show collections' || trimmedCmd === 'show tables') {
      try {
        const collections = await db.listCollections().toArray();
        const output = collections.map(c => c.name).sort().join('\n');
        return res.json({ success: true, output: output || 'No collections found', cwd });
      } catch (e) {
        return res.json({ success: false, error: "Error listing collections: " + e.message });
      }
    }

    // 4. Handle "use <dbname>"
    if (trimmedCmd.startsWith('use ')) {
      const newDbName = trimmedCmd.substring(4).trim();
      // In this simulation, we'll just pretend to switch or actually switch the 'db' reference effectively
      // For now, let's keep it simple: just acknowledge. 
      // To really switch, we'd need session persistence.
      // We will just verify it's a valid string.
      return res.json({
        success: true,
        output: `switched to db ${newDbName}`,
        cwd
      });
    }

    // 5. Handle "db.<collection>.<method>"
    if (trimmedCmd.startsWith('db.')) {
      try {
        // Regex to transform "db.users.find(...)" -> "db.collection('users').find(...)"
        // This is a naive transformation but works for standard collection names
        const scriptContent = trimmedCmd.replace(/^db\.([a-zA-Z0-9_]+)\./, "db.collection('$1').");

        // Create a sandbox
        const sandbox = {
          db: db, // The actual MongoDB driver instance
          ObjectId: ObjectId,
          console: { log: (msg) => { /* capture logs if needed */ } }
        };

        const context = vm.createContext(sandbox);
        const script = new vm.Script(scriptContent);

        // Execute
        let result = await script.runInContext(context);

        // Handle Cursors (find, aggregate)
        if (result && typeof result.toArray === 'function') {
          result = await result.toArray();
        }

        // Format Output
        let outputStr = '';
        if (Array.isArray(result)) {
          // If list of docs, pretty print first 20
          if (result.length === 0) {
            outputStr = '[]'; // Empty array
          } else {
            // Custom formatting for shell-like appearance
            outputStr = JSON.stringify(result, null, 2);
            if (result.length > 20) {
              outputStr = JSON.stringify(result.slice(0, 20), null, 2) + `\n... ${result.length - 20} more documents`;
            }
          }
        } else if (result && typeof result === 'object') {
          outputStr = JSON.stringify(result, null, 2);
        } else {
          outputStr = String(result);
        }

        return res.json({ success: true, output: outputStr, cwd });

      } catch (e) {
        return res.json({ success: false, error: "Mongo Shell Error: " + e.message });
      }
    }


    // ==========================================
    // SYSTEM SHELL (Fallback)
    // ==========================================

    // Security check
    // Normalize command: replace multiple spaces with single space
    const normalizedCmd = trimmedCmd.replace(/\s+/g, ' ');

    for (const blocked of BLOCKED_COMMANDS) {
      // Escape special regex characters in the blocked command if necessary, 
      // but our list seems simple. We'll use a precise check.
      if (normalizedCmd.toLowerCase().includes(blocked.toLowerCase())) {
        return res.json({
          success: false,
          error: `⛔ Command blocked for security reasons: ${blocked}`
        });
      }
    }

    // Determine working directory
    const workingDir = cwd && cwd.trim() ? cwd : process.cwd();

    // Execute command using PowerShell on Windows
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'powershell.exe' : '/bin/bash';
    const shellArgs = isWindows ? ['-NoProfile', '-Command', trimmedCmd] : ['-c', trimmedCmd];

    const child = spawn(shell, shellArgs, {
      cwd: workingDir,
      env: { ...process.env, TERM: 'xterm-256color' },
      timeout: 30000
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      // Get current working directory after command
      let newCwd = workingDir;

      // If cd command, try to get new directory
      if (trimmedCmd.toLowerCase().startsWith('cd ')) {
        const cdPath = trimmedCmd.substring(3).trim().replace(/['"]/g, '');
        if (path.isAbsolute(cdPath)) {
          newCwd = cdPath;
        } else {
          newCwd = path.resolve(workingDir, cdPath);
        }
      }

      res.json({
        success: code === 0,
        output: stdout || stderr,
        error: code !== 0 ? stderr : null,
        cwd: newCwd,
        exitCode: code
      });
    });

    child.on('error', (err) => {
      res.json({ success: false, error: err.message });
    });

  } catch (err) {
    console.error("Command execution error:", err);
    res.json({ success: false, error: err.message });
  }
});

// ============================================
// MONGODB QUERY DEMONSTRATOR - MAIN PAGE
// ============================================

app.get("/", async (req, res) => {
  try {
    // Get basic stats
    const stats = {
      courses: await db.collection("courses").countDocuments(),
      students: await db.collection("students").countDocuments(),
      enrollments: await db.collection("enrollments").countDocuments(),
      categories: await db.collection("categories").countDocuments(),
      instructors: await db.collection("instructors").countDocuments(),
      reviews: await db.collection("reviews").countDocuments(),
      payments: await db.collection("payments").countDocuments()
    };

    res.render("query-lab", { stats });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading page");
  }
});

// Query Lab route
app.get("/query-lab", async (req, res) => {
  try {
    const stats = {
      courses: await db.collection("courses").countDocuments(),
      students: await db.collection("students").countDocuments(),
      enrollments: await db.collection("enrollments").countDocuments(),
      categories: await db.collection("categories").countDocuments(),
      instructors: await db.collection("instructors").countDocuments(),
      reviews: await db.collection("reviews").countDocuments(),
      payments: await db.collection("payments").countDocuments()
    };

    res.render("query-lab", { stats });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading page");
  }
});

// Legacy query demonstrator route
app.get("/old", async (req, res) => {
  try {
    const stats = {
      courses: await db.collection("courses").countDocuments(),
      students: await db.collection("students").countDocuments(),
      enrollments: await db.collection("enrollments").countDocuments(),
      categories: await db.collection("categories").countDocuments(),
      instructors: await db.collection("instructors").countDocuments(),
      reviews: await db.collection("reviews").countDocuments(),
      payments: await db.collection("payments").countDocuments()
    };

    res.render("query-demonstrator", { stats });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading page");
  }
});

// ============================================
// EXECUTE QUERY API
// ============================================

app.post("/api/execute-query", async (req, res) => {
  try {
    const { queryType, queryId } = req.body;
    let result = {};

    switch (queryId) {
      // CRUD - CREATE
      case "crud-create":
        const newCourse = {
          title: "Demo Course - " + new Date().toISOString(),
          description: "This is a demo course created via the query demonstrator",
          category_id: (await db.collection("categories").findOne())._id,
          instructor_id: (await db.collection("instructors").findOne())._id,
          price: 99.99,
          duration_hours: 10,
          created_at: new Date(),
          tags: ["demo", "test"],
          rating: 0
        };
        result = await db.collection("courses").insertOne(newCourse);
        result.message = "Cours créé avec succès !";
        result.insertedDoc = newCourse;
        break;

      // CRUD - READ
      case "crud-read":
        const category = await db.collection("categories").findOne();
        result.courses = await db.collection("courses")
          .find({ category_id: category._id })
          .limit(5)
          .toArray();
        result.category = category.name;
        break;

      // CRUD - UPDATE
      case "crud-update":
        const courseToUpdate = await db.collection("courses").findOne();
        result.updateResult = await db.collection("courses").updateOne(
          { _id: courseToUpdate._id },
          { $set: { price: 79.99 } }
        );
        result.updatedCourse = await db.collection("courses").findOne({ _id: courseToUpdate._id });
        break;

      // CRUD - DELETE
      case "crud-delete":
        const inactiveCount = await db.collection("students").countDocuments({ status: "inactive" });
        result.deleteResult = await db.collection("students").deleteMany({ status: "inactive" });
        result.deletedCount = result.deleteResult.deletedCount;
        result.message = `Deleted ${result.deletedCount} inactive students`;
        break;

      // ADVANCED - TOP COURSES
      case "advanced-top-courses":
      case "advanced-top":
        result.courses = await db.collection("courses")
          .find()
          .sort({ rating: -1 })
          .limit(5)
          .toArray();
        break;

      // ADVANCED - STUDENTS BY COUNTRY
      case "advanced-students-country":
      case "advanced-country":
        result.data = await db.collection("students").aggregate([
          {
            $group: {
              _id: "$country",
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]).toArray();
        break;

      // ADVANCED - ENROLLMENT STATUS
      case "advanced-enrollment-status":
      case "advanced-status":
        result.data = await db.collection("enrollments").aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              avg_progress: { $avg: "$progress_percent" }
            }
          },
          { $sort: { count: -1 } }
        ]).toArray();
        break;

      // ADVANCED - TOTAL REVENUE
      case "advanced-revenue":
        result.data = await db.collection("payments").aggregate([
          {
            $group: {
              _id: null,
              total_revenue: { $sum: "$amount" },
              total_transactions: { $sum: 1 },
              avg_transaction: { $avg: "$amount" }
            }
          }
        ]).toArray();
        result.revenue = result.data[0];
        break;

      // AGGREGATION - COURSE JOIN
      case "agg-course-join":
        result.data = await db.collection("enrollments").aggregate([
          { $limit: 5 },
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
          { $limit: 5 }
        ]).toArray();
        break;

      // AGGREGATION - CATEGORY STATS
      case "agg-category-stats":
        result.data = await db.collection("courses").aggregate([
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
        break;

      // AGGREGATION - STUDENT PERFORMANCE
      case "agg-student-performance":
        result.data = await db.collection("enrollments").aggregate([
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
              courses_completed: { $sum: 1 },
              avg_grade: { $avg: "$final_grade" }
            }
          },
          { $sort: { avg_grade: -1 } },
          { $limit: 10 }
        ]).toArray();
        break;

      // AGGREGATION - ENROLLMENT TRENDS
      case "agg-enrollment-trends":
        result.data = await db.collection("enrollments").aggregate([
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
              },
              in_progress: {
                $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
              }
            }
          },
          { $sort: { _id: 1 } },
          { $limit: 12 }
        ]).toArray();
        break;

      // New aggregation query IDs
      case "agg-join":
        result.data = await db.collection("enrollments").aggregate([
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
          { $limit: 5 }
        ]).toArray();
        break;

      case "agg-category":
        result.data = await db.collection("courses").aggregate([
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
        break;

      case "agg-performance":
        result.data = await db.collection("enrollments").aggregate([
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
              courses_completed: { $sum: 1 },
              avg_grade: { $avg: "$final_grade" }
            }
          },
          { $sort: { avg_grade: -1 } },
          { $limit: 10 }
        ]).toArray();
        break;

      case "agg-trends":
        result.data = await db.collection("enrollments").aggregate([
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
              },
              in_progress: {
                $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
              }
            }
          },
          { $sort: { _id: 1 } },
          { $limit: 12 }
        ]).toArray();
        break;

      default:
        result.error = "Unknown query";
    }

    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

// ============================================
// EXECUTE CUSTOM QUERY API (Editable)
// ============================================

app.post("/api/execute-custom-query", async (req, res) => {
  try {
    const { queryId, queryText } = req.body;
    let result = {};

    // Execute based on query ID with actual MongoDB operations
    switch (queryId) {
      case "crud-create":
        const category = await db.collection("categories").findOne();
        const instructor = await db.collection("instructors").findOne();
        const newCourse = {
          title: "Demo Course - " + new Date().toISOString(),
          description: "Created via query demonstrator",
          category_id: category._id,
          instructor_id: instructor._id,
          price: 99.99,
          duration_hours: 10,
          created_at: new Date(),
          tags: ["demo"],
          rating: 0
        };
        result = await db.collection("courses").insertOne(newCourse);
        result.message = "Cours créé !";
        result.insertedDoc = newCourse;
        break;

      case "crud-read":
        const cat = await db.collection("categories").findOne();
        result.courses = await db.collection("courses")
          .find({ category_id: cat._id })
          .limit(5)
          .toArray();
        break;

      case "crud-update":
        const courseToUpdate = await db.collection("courses").findOne();
        result.updateResult = await db.collection("courses").updateOne(
          { _id: courseToUpdate._id },
          { $set: { price: 79.99 } }
        );
        result.updatedCourse = await db.collection("courses").findOne({ _id: courseToUpdate._id });
        break;

      case "crud-delete":
        result.deleteResult = await db.collection("students").deleteMany({ status: "inactive" });
        result.deletedCount = result.deleteResult.deletedCount;
        result.message = `Deleted ${result.deletedCount} inactive students`;
        break;

      case "advanced-top":
        result.courses = await db.collection("courses")
          .find()
          .sort({ rating: -1 })
          .limit(5)
          .toArray();
        break;

      case "advanced-country":
        result.data = await db.collection("students").aggregate([
          { $group: { _id: "$country", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]).toArray();
        break;

      case "advanced-revenue":
        result.data = await db.collection("payments").aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
              count: { $sum: 1 },
              avg: { $avg: "$amount" }
            }
          }
        ]).toArray();
        break;

      case "advanced-enrollment":
      case "advanced-status":
        result.data = await db.collection("enrollments").aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ]).toArray();
        break;

      default:
        result.error = "Unknown query";
    }

    res.json({ success: true, result, queryText });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

// ============================================
// RESET DATABASE API
// ============================================

app.post("/api/reset-database", async (req, res) => {
  try {
    console.log("🔄 Starting database reset...");

    // Drop all collections
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`  Dropped: ${collection.name}`);
    }

    // Reimport data using mongoimport
    const { exec } = require('child_process');
    const path = require('path');
    const dataDir = path.join(__dirname, '..', 'data', 'exported_extended_json');

    const collections_to_import = [
      'categories',
      'instructors',
      'students',
      'courses',
      'enrollments',
      'reviews',
      'payments'
    ];

    let importPromises = collections_to_import.map(collectionName => {
      return new Promise((resolve, reject) => {
        const filePath = path.join(dataDir, `${collectionName}.json`);
        const command = `mongoimport --db Bida --collection ${collectionName} --file "${filePath}"`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error importing ${collectionName}:`, error);
            reject(error);
          } else {
            console.log(`  Imported: ${collectionName}`);
            resolve();
          }
        });
      });
    });

    await Promise.all(importPromises);

    console.log("✅ Database reset complete!");
    res.json({ success: true, message: "Base de données réinitialisée avec succès" });
  } catch (err) {
    console.error("❌ Reset error:", err);
    res.json({ success: false, error: err.message });
  }
});

// ============================================
// REALTIME STATS API
// ============================================

app.get("/api/stats", async (req, res) => {
  try {
    const stats = {
      courses: await db.collection("courses").countDocuments(),
      students: await db.collection("students").countDocuments(),
      enrollments: await db.collection("enrollments").countDocuments(),
      categories: await db.collection("categories").countDocuments(),
      instructors: await db.collection("instructors").countDocuments(),
      reviews: await db.collection("reviews").countDocuments(),
      payments: await db.collection("payments").countDocuments(),
      timestamp: new Date().toISOString()
    };

    // Calculate some additional metrics
    const recentEnrollments = await db.collection("enrollments")
      .countDocuments({ enrolled_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });

    const avgRating = await db.collection("courses").aggregate([
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ]).toArray();

    const totalRevenue = await db.collection("payments").aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).toArray();

    stats.recentEnrollments = recentEnrollments;
    stats.avgRating = avgRating[0]?.avg || 0;
    stats.totalRevenue = totalRevenue[0]?.total || 0;

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// COLLECTION DATA API (for clickable stats)
// ============================================

app.get("/api/collection/:collectionName", async (req, res) => {
  try {
    const { collectionName } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    // Validate collection name
    const validCollections = ['courses', 'students', 'enrollments', 'categories', 'instructors', 'reviews', 'payments'];
    if (!validCollections.includes(collectionName)) {
      return res.status(400).json({ error: 'Invalid collection name' });
    }

    // Fetch ALL data with ALL attributes from each collection
    let data = [];

    switch (collectionName) {
      case 'courses':
        data = await db.collection('courses').aggregate([
          {
            $lookup: {
              from: 'categories',
              localField: 'category_id',
              foreignField: '_id',
              as: 'category_info'
            }
          },
          { $unwind: { path: '$category_info', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'instructors',
              localField: 'instructor_id',
              foreignField: '_id',
              as: 'instructor_info'
            }
          },
          { $unwind: { path: '$instructor_info', preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              category_name: '$category_info.name',
              instructor_name: '$instructor_info.name',
              instructor_email: '$instructor_info.email'
            }
          },
          { $sort: { created_at: -1, _id: -1 } },
          { $limit: limit }
        ]).toArray();
        break;

      case 'students':
        data = await db.collection('students').aggregate([
          {
            $lookup: {
              from: 'enrollments',
              localField: '_id',
              foreignField: 'student_id',
              as: 'enrollment_list'
            }
          },
          {
            $addFields: {
              total_enrollments: { $size: '$enrollment_list' }
            }
          },
          { $project: { enrollment_list: 0 } },
          { $sort: { registered_at: -1 } },
          { $limit: limit }
        ]).toArray();
        break;

      case 'enrollments':
        data = await db.collection('enrollments').aggregate([
          {
            $lookup: {
              from: 'students',
              localField: 'student_id',
              foreignField: '_id',
              as: 'student_info'
            }
          },
          { $unwind: { path: '$student_info', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'courses',
              localField: 'course_id',
              foreignField: '_id',
              as: 'course_info'
            }
          },
          { $unwind: { path: '$course_info', preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              student_name: '$student_info.name',
              student_email: '$student_info.email',
              course_title: '$course_info.title',
              course_price: '$course_info.price'
            }
          },
          { $sort: { enrolled_at: -1 } },
          { $limit: limit }
        ]).toArray();
        break;

      case 'categories':
        data = await db.collection('categories').aggregate([
          {
            $lookup: {
              from: 'courses',
              localField: '_id',
              foreignField: 'category_id',
              as: 'course_list'
            }
          },
          {
            $addFields: {
              total_courses: { $size: '$course_list' },
              avg_course_price: { $avg: '$course_list.price' },
              avg_course_rating: { $avg: '$course_list.rating' }
            }
          },
          { $project: { course_list: 0 } },
          { $sort: { total_courses: -1 } },
          { $limit: limit }
        ]).toArray();
        break;

      case 'instructors':
        data = await db.collection('instructors').aggregate([
          {
            $lookup: {
              from: 'courses',
              localField: '_id',
              foreignField: 'instructor_id',
              as: 'course_list'
            }
          },
          {
            $addFields: {
              total_courses: { $size: '$course_list' },
              avg_rating: { $avg: '$course_list.rating' },
              total_duration_hours: { $sum: '$course_list.duration_hours' }
            }
          },
          { $project: { course_list: 0 } },
          { $sort: { total_courses: -1 } },
          { $limit: limit }
        ]).toArray();
        break;

      case 'reviews':
        data = await db.collection('reviews').aggregate([
          {
            $lookup: {
              from: 'students',
              localField: 'student_id',
              foreignField: '_id',
              as: 'student_info'
            }
          },
          { $unwind: { path: '$student_info', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'courses',
              localField: 'course_id',
              foreignField: '_id',
              as: 'course_info'
            }
          },
          { $unwind: { path: '$course_info', preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              student_name: '$student_info.name',
              student_email: '$student_info.email',
              course_title: '$course_info.title'
            }
          },
          { $sort: { created_at: -1 } },
          { $limit: limit }
        ]).toArray();
        break;

      case 'payments':
        data = await db.collection('payments').aggregate([
          {
            $lookup: {
              from: 'students',
              localField: 'student_id',
              foreignField: '_id',
              as: 'student_info'
            }
          },
          { $unwind: { path: '$student_info', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'courses',
              localField: 'course_id',
              foreignField: '_id',
              as: 'course_info'
            }
          },
          { $unwind: { path: '$course_info', preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              student_name: '$student_info.name',
              student_email: '$student_info.email',
              course_title: '$course_info.title',
              course_price: '$course_info.price'
            }
          },
          { $sort: { paid_at: -1 } },
          { $limit: limit }
        ]).toArray();
        break;
    }

    res.json({
      success: true,
      collection: collectionName,
      count: data.length,
      data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// EXECUTE RAW QUERY API - Actually parses user input
// ============================================

app.post("/api/execute-raw-query", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.json({ success: false, error: "No query provided" });
    }

    // Parse the MongoDB shell-style query with chained methods
    // Handle: db.collection.method({...}).chain1().chain2()

    // Helper to find matching closing parenthesis - tracks all bracket types
    const getArgsFromStr = (str, openParenPos) => {
      let parenDepth = 1;  // ()
      let braceDepth = 0;  // {}
      let bracketDepth = 0; // []
      let inString = false;
      let stringChar = '';
      let i = openParenPos;

      while (i < str.length && parenDepth > 0) {
        const char = str[i];
        const prevChar = i > 0 ? str[i - 1] : '';

        // Handle string boundaries (ignore brackets inside strings)
        if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
          }
        }

        if (!inString) {
          if (char === '(') parenDepth++;
          else if (char === ')') parenDepth--;
          else if (char === '{') braceDepth++;
          else if (char === '}') braceDepth--;
          else if (char === '[') bracketDepth++;
          else if (char === ']') bracketDepth--;
        }
        i++;
      }

      if (parenDepth > 0) return null;
      return { args: str.substring(openParenPos, i - 1), end: i };
    };

    const baseMatch = query.match(/db\.(\w+)\.(\w+)\s*\(/);
    if (!baseMatch) {
      return res.json({ success: false, error: "Invalid query format. Expected: db.collection.method(...)" });
    }

    const collectionName = baseMatch[1];
    const methodName = baseMatch[2];
    const startIndex = query.indexOf('(', baseMatch.index + 3 + collectionName.length + 1 + methodName.length) + 1;

    const resultArgs = getArgsFromStr(query, baseMatch.index + baseMatch[0].length);
    if (!resultArgs) {
      return res.json({ success: false, error: "Unbalanced parentheses in query" });
    }

    const argsString = resultArgs.args;
    let remainingQuery = query.substring(resultArgs.end);

    // Extract chained methods
    const chainedMethods = [];
    let chainMatch;
    while ((chainMatch = remainingQuery.match(/^\s*\.(\w+)\s*\(/)) !== null) {
      const chainStartIndex = chainMatch[0].length;
      const chainArgsResult = getArgsFromStr(remainingQuery, chainStartIndex);
      if (!chainArgsResult) break;

      chainedMethods.push({
        method: chainMatch[1],
        args: chainArgsResult.args.trim()
      });
      remainingQuery = remainingQuery.substring(chainArgsResult.end);
    }

    // Validate collection name
    const validCollections = ['courses', 'students', 'enrollments', 'categories', 'instructors', 'reviews', 'payments'];
    if (!validCollections.includes(collectionName)) {
      return res.json({ success: false, error: `Invalid collection: ${collectionName}` });
    }

    const collection = db.collection(collectionName);
    let result;

    // Helper function to parse arguments safely using JSON5
    const JSON5 = require('json5');

    // Custom JSON5 parse that handles special MongoDB types before parsing
    const parseArgs = (argStr) => {
      if (!argStr || argStr.trim() === '') return [];

      let sanitizedArgs = argStr;
      try {
        // Pre-processing to make MongoDB types JSON5-compatible strings
        // We wrap them in special string markers that we'll convert back later
        sanitizedArgs = argStr
          // Handle new Date() - with or without args
          .replace(/new\s+Date\((.*?)\)/g, (match, args) => {
            const cleanArgs = args.trim().replace(/['"]/g, '');
            return cleanArgs ? `'__DATE:${cleanArgs}__'` : `'__DATE_NOW__'`;
          })
          // Handle ObjectId("...")
          .replace(/ObjectId\(\s*["']([^"']+)["']\s*\)/g, `'__OID:$1__'`)
          // Handle {"$oid": "..."}
          .replace(/\{\s*"\$oid"\s*:\s*"([^"]+)"\s*\}/g, `'__OID:$1__'`);

        // Wrap in array brackets to parse as a list of arguments
        const parsed = JSON5.parse(`[${sanitizedArgs}]`);

        // Post-process to convert special string markers back to actual Objects
        const processValue = (obj, key = '') => {
          if (typeof obj === 'string') {
            if (obj === '__DATE_NOW__') return new Date();
            if (obj.startsWith('__DATE:') && obj.endsWith('__')) {
              return new Date(obj.slice(7, -2));
            }
            if (obj.startsWith('__OID:') && obj.endsWith('__')) {
              return new ObjectId(obj.slice(6, -2));
            }
            // Auto-convert 24-char hex strings to ObjectId for _id fields
            if (/^[a-f0-9]{24}$/i.test(obj) && (key === '_id' || key.endsWith('_id'))) {
              return new ObjectId(obj);
            }
          }
          if (Array.isArray(obj)) return obj.map(item => processValue(item, key));
          if (obj && typeof obj === 'object' && obj !== null) {
            const processed = {};
            for (const [k, value] of Object.entries(obj)) {
              processed[k] = processValue(value, k);
            }
            return processed;
          }
          return obj;
        };

        return parsed.map(processValue);
      } catch (e) {
        console.error("Parse Error Details:", e.message);
        throw new Error(`Failed to parse arguments: ${e.message}`);
      }
    };

    // Parse main arguments
    let args = [];
    if (argsString) {
      try {
        args = parseArgs(argsString);
      } catch (parseError) {
        return res.json({ success: false, error: parseError.message });
      }
    }

    // Execute the appropriate method
    switch (methodName) {
      case 'find':
        const findQuery = args[0] || {};
        const projection = args[1] || {};
        let cursor = collection.find(findQuery, { projection });

        // Apply chained methods
        for (const chain of chainedMethods) {
          const chainArgs = chain.args ? parseArgs(chain.args) : [];
          switch (chain.method) {
            case 'sort':
              cursor = cursor.sort(chainArgs[0] || {});
              break;
            case 'limit':
              cursor = cursor.limit(parseInt(chainArgs[0]) || 10);
              break;
            case 'skip':
              cursor = cursor.skip(parseInt(chainArgs[0]) || 0);
              break;
          }
        }

        // Default limit for safety
        if (!chainedMethods.some(c => c.method === 'limit')) {
          cursor = cursor.limit(50);
        }
        result = await cursor.toArray();
        break;

      case 'findOne':
        result = await collection.findOne(args[0] || {});
        break;

      case 'insertOne':
        const docToInsert = args[0];
        if (!docToInsert) {
          return res.json({ success: false, error: "insertOne requires a document" });
        }

        const insertError = validateDocument(docToInsert, collectionName);
        if (insertError) {
          return res.json({ success: false, error: `⛔ Data Validation Error: ${insertError}` });
        }

        const insertResult = await collection.insertOne(docToInsert);
        result = {
          acknowledged: insertResult.acknowledged,
          insertedId: insertResult.insertedId,
          message: "Document créé avec succès !",
          insertedDoc: { ...docToInsert, _id: insertResult.insertedId }
        };
        break;

      case 'insertMany':
        const docsToInsert = args[0];
        if (!Array.isArray(docsToInsert)) {
          return res.json({ success: false, error: "insertMany requires an array of documents" });
        }

        for (const d of docsToInsert) {
          const err = validateDocument(d, collectionName);
          if (err) return res.json({ success: false, error: `⛔ Data Validation Error in one of the documents: ${err}` });
        }

        const insertManyResult = await collection.insertMany(docsToInsert);
        result = {
          acknowledged: insertManyResult.acknowledged,
          insertedCount: insertManyResult.insertedCount,
          insertedIds: insertManyResult.insertedIds,
          message: `${insertManyResult.insertedCount} documents créés avec succès !`
        };
        break;

      case 'updateOne':
        const updateFilter = args[0] || {};
        const updateDoc = args[1] || {};

        // Validate based on $set or top-level fields
        const docToValidate = updateDoc.$set || updateDoc;
        const updateError = validateDocument(docToValidate, collectionName);
        if (updateError) {
          return res.json({ success: false, error: `⛔ Data Validation Error: ${updateError}` });
        }

        const updateResult = await collection.updateOne(updateFilter, updateDoc);
        result = {
          acknowledged: updateResult.acknowledged,
          matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount,
          message: updateResult.modifiedCount > 0 ? "Document mis à jour !" : "Aucun document modifié"
        };
        break;

      case 'updateMany':
        const updateManyFilter = args[0] || {};
        const updateManyDoc = args[1] || {};

        const docToValidateMany = updateManyDoc.$set || updateManyDoc;
        const updateManyError = validateDocument(docToValidateMany, collectionName);
        if (updateManyError) {
          return res.json({ success: false, error: `⛔ Data Validation Error: ${updateManyError}` });
        }

        const updateManyResult = await collection.updateMany(updateManyFilter, updateManyDoc);
        result = {
          acknowledged: updateManyResult.acknowledged,
          matchedCount: updateManyResult.matchedCount,
          modifiedCount: updateManyResult.modifiedCount,
          message: `${updateManyResult.modifiedCount} documents mis à jour !`
        };
        break;

      case 'deleteOne':
        const deleteFilter = args[0] || {};
        const deleteResult = await collection.deleteOne(deleteFilter);
        result = {
          acknowledged: deleteResult.acknowledged,
          deletedCount: deleteResult.deletedCount,
          message: deleteResult.deletedCount > 0 ? "Document supprimé !" : "Aucun document supprimé"
        };
        break;

      case 'deleteMany':
        const deleteManyFilter = args[0] || {};
        const deleteManyResult = await collection.deleteMany(deleteManyFilter);
        result = {
          acknowledged: deleteManyResult.acknowledged,
          deletedCount: deleteManyResult.deletedCount,
          message: `${deleteManyResult.deletedCount} documents supprimés !`
        };
        break;

      case 'countDocuments':
        result = {
          count: await collection.countDocuments(args[0] || {}),
          message: "Comptage terminé"
        };
        break;

      case 'aggregate':
        const pipeline = args[0];
        if (!Array.isArray(pipeline)) {
          return res.json({ success: false, error: "aggregate requires a pipeline array" });
        }
        result = await collection.aggregate(pipeline).toArray();
        break;

      case 'distinct':
        const field = args[0];
        const distinctFilter = args[1] || {};
        if (!field) {
          return res.json({ success: false, error: "distinct requires a field name" });
        }
        result = await collection.distinct(field, distinctFilter);
        break;

      default:
        return res.json({ success: false, error: `Unsupported method: ${methodName}` });
    }

    res.json({
      success: true,
      result,
      executedQuery: {
        collection: collectionName,
        method: methodName,
        args: args
      }
    });

  } catch (err) {
    console.error("Raw query execution error:", err);

    // Handle MongoDB Schema Validation Error
    if (err.code === 121) {
      return res.json({
        success: false,
        error: "⛔ Validation Error: The data violates the schema rules. Please check for negative numbers, invalid ranges, or missing required fields."
      });
    }

    res.json({ success: false, error: err.message });
  }
});

// Helper function for data validation
function validateDocument(doc, collectionName) {
  if (!doc) return null;

  const errors = [];

  // Common checks
  if (collectionName === 'courses') {
    if (doc.price !== undefined && doc.price < 0) {
      errors.push("Price cannot be negative");
    }
    if (doc.rating !== undefined && (doc.rating < 0 || doc.rating > 5)) {
      errors.push("Rating must be between 0 and 5");
    }
    if (doc.duration_hours !== undefined && doc.duration_hours <= 0) {
      errors.push("Duration must be positive");
    }
  }

  if (collectionName === 'reviews') {
    if (doc.rating !== undefined && (doc.rating < 0 || doc.rating > 5)) {
      errors.push("Rating must be between 0 and 5");
    }
  }

  if (collectionName === 'enrollments') {
    if (doc.progress_percent !== undefined && (doc.progress_percent < 0 || doc.progress_percent > 100)) {
      errors.push("Progress must be between 0 and 100");
    }
    if (doc.final_grade !== undefined && doc.final_grade !== null && (doc.final_grade < 0 || doc.final_grade > 100)) {
      errors.push("Final grade must be between 0 and 100");
    }
  }

  if (collectionName === 'payments') {
    if (doc.amount !== undefined && doc.amount < 0) {
      errors.push("Payment amount cannot be negative");
    }
  }

  return errors.length > 0 ? errors.join(", ") : null;
}

// Error handling
app.use((req, res) => {
  res.status(404).render("404", { url: req.url });
});

module.exports = app;
