import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");
const STATS_FILE = path.join(ROOT_DIR, "stats.html");

console.log("🔍 Starting Bundle Analysis...");

try {
  // 1. Run the build command (which triggers the visualizer plugin)
  console.log("📦 Building project...");
  execSync("tsc -b && vite build", {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });

  // 2. Check if stats.html exists
  if (fs.existsSync(STATS_FILE)) {
    console.log("✅ Build successful. stats.html generated.");

    // 3. Instruction to open it
    console.log(`\n📊 Report available at: ${STATS_FILE}`);
    console.log("👉 Open this file in your browser to analyze the bundle.");

    // Optional: Try to open automatically based on OS
    try {
      const startCommand =
        process.platform == "darwin"
          ? "open"
          : process.platform == "win32"
            ? "start"
            : "xdg-open";
      execSync(`${startCommand} "${STATS_FILE}"`);
    } catch (e) {
      // Ignore errors if auto-open fails
    }
  } else {
    console.error(
      "❌ Error: stats.html was not generated. Check vite.config.ts configuration."
    );
  }
} catch (error) {
  console.error("❌ Build failed during analysis.");
  process.exit(1);
}
