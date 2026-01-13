const http = require('http');

function postRequest(query) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query });
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/execute-raw-query',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log("🧪 Starting Validation Tests...");
    let failed = false;

    // Test 1: Negative Price (Should Fail)
    console.log("\n[Test 1] Insert Course with Negative Price (-10)");
    try {
        const res = await postRequest(`db.courses.insertOne({ title: "Test Bad Price", price: -10, rating: 5 })`);
        if (res.success === false && res.error && res.error.includes("Price cannot be negative")) {
            console.log("✅ Passed: Correctly blocked negative price.");
        } else {
            console.log("❌ Failed: Did not block negative price.", res);
            failed = true;
        }
    } catch (e) { console.error("Error:", e.message); failed = true; }

    // Test 2: Invalid Rating (Should Fail)
    console.log("\n[Test 2] Insert Course with Invalid Rating (6)");
    try {
        const res = await postRequest(`db.courses.insertOne({ title: "Test Bad Rating", price: 10, rating: 6 })`);
        if (res.success === false && res.error && res.error.includes("Rating must be between 0 and 5")) {
            console.log("✅ Passed: Correctly blocked invalid rating.");
        } else {
            console.log("❌ Failed: Did not block invalid rating.", res);
            failed = true;
        }
    } catch (e) { console.error("Error:", e.message); failed = true; }

    // Test 3: Valid Insert (Should Succeed)
    console.log("\n[Test 3] Insert Valid Course");
    try {
        const res = await postRequest(`db.courses.insertOne({ title: "Test Good Course", price: 10, duration_hours: 5, rating: 5 })`);
        if (res.success === true) {
            console.log("✅ Passed: Valid insert succeeded.");
            // Cleanup
            await postRequest(`db.courses.deleteOne({ _id: ObjectId("${res.result.insertedId}") })`);
        } else {
            console.log("❌ Failed: Valid insert failed.", res);
            failed = true;
        }
    } catch (e) { console.error("Error:", e.message); failed = true; }

    if (failed) {
        console.log("\n⛔ Tests Failed. The server might need a restart to apply changes.");
    } else {
        console.log("\n🎉 All Tests Passed!");
    }
}

runTests();
