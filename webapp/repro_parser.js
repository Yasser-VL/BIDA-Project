
const query = `
            db.courses.insertOne({
                title: "Advanced Machine Learning with Python",
                description: "Master advanced ML algorithms and deep learning techniques",
                price: 149.99,
                duration_hours: 45.5,
                created_at: new Date(),
                tags: ["machine-learning", "python", "AI"],
                rating: 0
            })`;

const parseArgs = (argStr) => {
    if (!argStr || argStr.trim() === '') return [];

    try {
        console.log("Original Args:", argStr);
        // Replace MongoDB-specific syntax
        let sanitizedArgs = argStr
            .replace(/new\s+Date\(\s*\)/g, `"$$DATE_NOW$$"`)
            .replace(/new\s+Date\(([^)]+)\)/g, `"$$DATE:$1$$"`)
            .replace(/ObjectId\(["']([^"']+)["']\)/g, `"$$OID:$1$$"`)
            .replace(/\{\s*"\$oid"\s*:\s*"([^"]+)"\s*\}/g, `"$$OID:$1$$"`);

        console.log("Sanitized Args:", sanitizedArgs);

        // Parse as array
        const parsed = Function(`"use strict"; return [${sanitizedArgs}]`)();
        console.log("Parsed result:", parsed);
        return parsed;
    } catch (e) {
        console.log("Parse Error details:", e);
        throw new Error(`Failed to parse: ${e.message}`);
    }
};

const getArgsFromStr = (str, openParenPos) => {
    let depth = 1;
    let i = openParenPos;
    console.log("Starting scan at index:", i, "Char:", str[i]);

    while (i < str.length && depth > 0) {
        if (str[i] === '(') depth++;
        else if (str[i] === ')') depth--;
        i++;
    }
    if (depth > 0) return null;
    return { args: str.substring(openParenPos, i - 1), end: i };
};

const run = () => {
    console.log("Testing query parsing...");
    const baseMatch = query.match(/db\.(\w+)\.(\w+)\s*\(/);
    if (!baseMatch) {
        console.log("No regex match");
        return;
    }

    console.log("Match:", baseMatch[0]);
    // server.js logic:
    const startPos = baseMatch.index + baseMatch[0].length;

    const resultArgs = getArgsFromStr(query, startPos);
    if (!resultArgs) {
        console.log("Unbalanced parentheses");
        return;
    }

    console.log("Extracted args string length:", resultArgs.args.length);

    try {
        parseArgs(resultArgs.args);
        console.log("Parse Successful!");
    } catch (e) {
        console.log("Main Error:", e.message);
    }
};

run();
