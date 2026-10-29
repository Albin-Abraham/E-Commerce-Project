import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_MODES = ["development", "test", "staging", "production"];

// Mode resolution order:
//   1. `--mode <name>` argv
//   2. VITE_APP_ENV env var (set by the Dockerfile's ARG and by CI)
//   3. "production"
const argvMode = (() => {
  const i = process.argv.indexOf("--mode");
  return i !== -1 ? process.argv[i + 1] : undefined;
})();
const MODE = argvMode ?? process.env.VITE_APP_ENV ?? "production";

if (!VALID_MODES.includes(MODE)) {
  console.error(
    `❌ Invalid build mode "${MODE}". Expected one of: ${VALID_MODES.join(", ")}`
  );
  process.exit(1);
}

// The Vite *mode* and the axios *profile* are not always the same string.
// Vitest runs in mode "test" -- so the config file is .env.test -- but the
// axios environment is named "testing" in src/core/configs/api/axios/axios.env.ts.
// Exporting the mode name verbatim made VITE_APP_ENV="test", which is not a key
// of ENVIRONMENTS, so axios.env.runtime.ts silently fell back to the
// development profile and shipped verbose request logging.
const PROFILE_BY_MODE = { test: "testing" };

// Vite loads .env.<MODE>; the committed per-mode files are the source of truth
// for the axios configuration, so export the profile name they declare rather
// than the mode name, and let the guard in vite.config.ts verify it.
process.env.VITE_APP_ENV = PROFILE_BY_MODE[MODE] ?? MODE;

console.log(
  `🚀 Zenith Build Orchestrator: Initializing (mode: ${MODE}, ` +
    `profile: ${process.env.VITE_APP_ENV})...`
);

const runChecks = () => {
  console.log("🔍 Running Integrity Checks...");
  try {
    execSync("pnpm run tokens:check", { stdio: "inherit" });
    console.log("✅ Styling Tokens Verified");

    execSync("npx tsc --noEmit", { stdio: "inherit" });
    console.log("✅ Type Integrity Verified");
  } catch {
    console.error("❌ Integrity Checks Failed");
    process.exit(1);
  }
};

const performBuild = () => {
  console.log(`📦 Building Application (mode: ${MODE})...`);
  try {
    execSync(`npx vite build --mode ${MODE}`, { stdio: "inherit" });
    console.log("✅ Build Complete");
  } catch {
    console.error("❌ Build Failed");
    process.exit(1);
  }
};

const main = () => {
  runChecks();
  performBuild();
  console.log(`\n🌟 Build Successful (${MODE})\n`);
};

main();
