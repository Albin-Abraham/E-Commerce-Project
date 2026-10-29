import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export function captureGitState() {
  try {
    return execSync("git ls-files --others --exclude-standard")
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch (err) {
    return [];
  }
}

export function performRollback(initialFiles) {
  console.log("\n⚠️ Scaffolding failed or interrupted. Initiating rollback...");
  try {
    const currentFiles = execSync("git ls-files --others --exclude-standard")
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean);

    // Find files that are new since we started
    const filesToDelete = currentFiles.filter(
      (file) => !initialFiles.includes(file)
    );

    if (filesToDelete.length === 0) {
      console.log("🔄 No new files were created. Rollback complete.");
      return;
    }

    filesToDelete.forEach((file) => {
      const fullPath = path.resolve(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️ Deleted: ${file}`);
      }
    });

    console.log("🔄 Rollback complete. Your workspace is clean.");
  } catch (err) {
    console.error(
      "❌ Rollback failed. Please check your workspace manually.",
      err.message
    );
  }
}
