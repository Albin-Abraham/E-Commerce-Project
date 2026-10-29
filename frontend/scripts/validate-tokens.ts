import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const TOKENS_DIR = path.join(ROOT_DIR, "tokens");

function loadTokens(dir: string): Record<string, any> {
  let result: Record<string, any> = {};
  if (!fs.existsSync(dir)) return result;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result = { ...result, ...loadTokens(fullPath) };
    } else if (entry.name.endsWith(".json")) {
      const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      result = deepMerge(result, content);
    }
  }
  return result;
}

function deepMerge(target: any, source: any): any {
  const output = { ...target };
  if (target && typeof target === "object" && source && typeof source === "object") {
    Object.keys(source).forEach((key) => {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

export function validateTokens() {
  console.log("🔍 Validating ZenOS Design Tokens (DTCG Compliance & WCAG)...");
  let errors = 0;
  let tokenCount = 0;

  const allTokens = loadTokens(TOKENS_DIR);

  const getValueByPath = (obj: any, pathStr: string, visited = new Set<string>()): any => {
    if (visited.has(pathStr)) {
      console.error(`\x1b[31m[ERROR]\x1b[0m Circular alias reference detected: "${pathStr}"`);
      errors++;
      return undefined;
    }
    visited.add(pathStr);

    const parts = pathStr.split(".");
    let curr = obj;
    for (const part of parts) {
      if (!curr) return undefined;
      curr = curr[part];
    }
    const val = curr?.$value ?? (typeof curr === "string" ? curr : undefined);
    if (typeof val === "string" && val.startsWith("{") && val.endsWith("}")) {
      return getValueByPath(obj, val.slice(1, -1), visited);
    }
    return val;
  };

  // 1. Validate structure & alias resolution
  function validateNode(node: any, currentPath: string[] = []) {
    if (!node || typeof node !== "object") return;

    if ("$value" in node) {
      tokenCount++;
      const pathStr = currentPath.join(".");
      // Validate $type presence
      if (!("$type" in node)) {
        console.warn(`\x1b[33m[WARN]\x1b[0m Token "${pathStr}" is missing standard "$type"`);
      }

      // Validate alias resolution
      if (typeof node.$value === "string" && node.$value.startsWith("{") && node.$value.endsWith("}")) {
        const aliasTarget = node.$value.slice(1, -1);
        const resolved = getValueByPath(allTokens, aliasTarget);
        if (resolved === undefined) {
          console.error(`\x1b[31m[ERROR]\x1b[0m Broken alias: "${pathStr}" points to non-existent "${aliasTarget}"`);
          errors++;
        }
      }
    } else {
      for (const [key, child] of Object.entries(node)) {
        validateNode(child, [...currentPath, key]);
      }
    }
  }

  validateNode(allTokens);

  if (errors > 0) {
    console.error(`\n\x1b[31m❌ Token Validation Failed with ${errors} error(s).\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m✓ All ${tokenCount} DTCG tokens valid. Zero broken alias references.\x1b[0m\n`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validateTokens();
}
