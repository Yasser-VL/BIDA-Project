const http = require('http');

const PREDEFINED_QUERIES = [
    'crud-read',
    'advanced-top-courses',
    'advanced-students-country',
    'advanced-enrollment-status',
    'advanced-revenue',
    'agg-course-join',
    'agg-category-stats',
    'agg-student-performance',
    'agg-enrollment-trends'
];

function request(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', chunk => responseBody += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseBody));
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${responseBody}`));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function verifyAll() {
    console.log("🚀 Starting Comprehensive Query Verification...\n");
    let failures = 0;

    // 1. Verify Predefined Queries
    console.log("--- Testing Predefined Queries (/api/execute-query) ---");
    for (const qId of PREDEFINED_QUERIES) {
        process.stdout.write(`Testing ${qId}... `);
        try {
            const res = await request('/api/execute-query', { queryId: qId });
            if (res.success) {
                const resultCount = Array.isArray(res.result.data) ? res.result.data.length :
                    Array.isArray(res.result.courses) ? res.result.courses.length :
                        'OK';
                console.log(`✅ Success (Data: ${resultCount})`);
            } else {
                console.log(`❌ Failed: ${res.error}`);
                failures++;
            }
        } catch (e) {
            console.log(`❌ Error: ${e.message}`);
            failures++;
        }
    }

    // 2. Verify Raw Query Parsing (Complex Aggregation)
    console.log("\n--- Testing Raw Query Parsing (/api/execute-raw-query) ---");

    // Aggregation Test
    const rawAggQuery = `
        db.enrollments.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ])
    `;
    process.stdout.write(`Testing Raw Aggregation Parsing... `);
    try {
        const res = await request('/api/execute-raw-query', { query: rawAggQuery });
        if (res.success && Array.isArray(res.result) && res.result.length > 0) {
            console.log(`✅ Success (Counted ${res.result.length} statuses)`);
        } else {
            console.log(`❌ Failed: ${res.error || "No data returned"}`);
            failures++;
        }
    } catch (e) {
        console.log(`❌ Error: ${e.message}`);
        failures++;
    }

    // Insert Validation Test (Double Check)
    process.stdout.write(`Testing Validation on Raw Insert... `);
    try {
        const res = await request('/api/execute-raw-query', {
            query: `db.courses.insertOne({ title: "Bad Course", price: -50 })`
        });
        if (res.success === false && res.error && res.error.includes("Price cannot be negative")) {
            console.log(`✅ Success (Correctly Blocked)`);
        } else {
            console.log(`❌ Failed: Should have been blocked. Result:`, res);
            failures++;
        }
    } catch (e) {
        console.log(`❌ Error: ${e.message}`);
        failures++;
    }

    console.log(`\n🏁 Summary: ${failures === 0 ? 'All tests passed!' : `${failures} tests failed.`}`);
}

verifyAll();
