const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

// ===== CONFIG =====
const inputFiles = [
    "src/loading.js",
    "src/toast.js",
    "src/cookie.js",
    "src/event.js",
    "src/auth.js",
    "src/validator.js",
    "src/CUrl.js",
    "src/form.js"
];

const outputFile = "dist/bundle.min.js";
// ==================

async function build() {
    try {
        // Read and combine files
        let combined = "";

        for (const file of inputFiles) {
            const filePath = path.resolve(file);
            const content = fs.readFileSync(filePath, "utf8");
            combined += content + "\n";
        }

        // Minify
        const result = await minify(combined);

        if (result.error) {
            console.error("Minify error:", result.error);
            process.exit(1);
        }

        // Ensure dist folder exists
        fs.mkdirSync(path.dirname(outputFile), { recursive: true });

        // Write output
        fs.writeFileSync(outputFile, result.code, "utf8");

        console.log("Build successful:", outputFile);
    } catch (err) {
        console.error("Build failed:", err);
        process.exit(1);
    }
}

build();