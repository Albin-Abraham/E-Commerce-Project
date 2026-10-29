const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "../src");
const STYLES_DIR = path.join(SRC_DIR, "shared/styles");
const TOKENS_FILE = path.join(STYLES_DIR, "tokens.css");
const TOKENS_SUBDIR = path.join(STYLES_DIR, "tokens");

/**
 * Extracts CSS variables defined across tokens and base styles.
 * Matches definitions (--name: value).
 */
function getTokens() {
  const definitions = new Set();
  const defRegex = /--([\w-]+)\s*:/g;

  function collectFromFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, "utf8");
    let match;
    while ((match = defRegex.exec(content)) !== null) {
      definitions.add(match[1]);
    }
  }

  // Scan root tokens.css, base.css, and generated build/tokens/tokens.css
  collectFromFile(TOKENS_FILE);
  collectFromFile(path.join(STYLES_DIR, "base.css"));
  collectFromFile(path.join(__dirname, "../build/tokens/tokens.css"));

  // Scan all CSS files in shared/styles
  function walkStyles(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkStyles(fullPath);
      } else if (entry.name.endsWith(".css")) {
        collectFromFile(fullPath);
      }
    }
  }

  walkStyles(STYLES_DIR);

  return definitions;
}

function getAllSourceFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
        files.push(...getAllSourceFiles(fullPath));
      }
    } else if (/\.(css|ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkUsages(definitions) {
  let errors = 0;
  const files = getAllSourceFiles(SRC_DIR);

  // Regex matching var(--name) or var(--name, fallback)
  const usageRegex = /var\(\s*--([\w-]+)(?:\s*,\s*([^)]+))?\)/g;

  files.forEach((filePath) => {
    const relativePath = path.relative(SRC_DIR, filePath);
    const content = fs.readFileSync(filePath, "utf8");
    let match;

    while ((match = usageRegex.exec(content)) !== null) {
      const tokenName = match[1];
      const fallback = match[2];

      // If token is defined in CSS variables or has a non-empty fallback, it's valid
      if (!definitions.has(tokenName) && !fallback) {
        console.error(
          `\x1b[31m[ERROR]\x1b[0m Undefined token usage: --${tokenName} in ${relativePath}`
        );
        errors++;
      }
    }
  });

  if (errors > 0) {
    console.error(
      `\n\x1b[31mValidation failed with ${errors} error(s).\x1b[0m`
    );
    process.exit(1);
  } else {
    console.log(
      `\x1b[32m[SUCCESS]\x1b[0m All styling tokens across ${files.length} source files are valid (${definitions.size} tokens recognized).`
    );
  }
}

try {
  console.log("--- Checking Styling Tokens Across Codebase ---");
  const definitions = getTokens();
  checkUsages(definitions);
} catch (err) {
  console.error("Failed to run token check:", err.message);
  process.exit(1);
}
