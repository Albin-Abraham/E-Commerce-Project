import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../../src/core/i18n");
const EN_DIR = path.join(ROOT_DIR, "en");
const TYPES_FILE = path.join(ROOT_DIR, "types.ts");

/**
 * Sorts an object by its keys recursively.
 */
function sortObject(obj) {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObject);

  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObject(obj[key]);
      return acc;
    }, {});
}

/**
 * Extracts variables from a translation string.
 */
function extractVariables(text) {
  if (typeof text !== "string") return [];
  const matches = text.match(/(?:%\{\s*([a-zA-Z0-9_]+)\s*\}|\{\{\s*([a-zA-Z0-9_]+)\s*\}\})/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/[%{}]/g, "").trim());
}

/**
 * Generates type definitions for a nested object.
 */
function generateKeyTypes(obj, indent = "  ") {
  const lines = [];
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (typeof value === "object" && value !== null) {
      lines.push(`${indent}'${key}': {`);
      lines.push(...generateKeyTypes(value, indent + "  "));
      lines.push(`${indent}};`);
    } else {
      const vars = extractVariables(value);
      if (vars.length > 0) {
        const varType = vars.map((v) => `${v}: string | number`).join("; ");
        lines.push(`${indent}'${key}': { ${varType} };`);
      } else {
        lines.push(`${indent}'${key}': never;`);
      }
    }
  });
  return lines;
}

/**
 * Main Sync Function
 */
function sync() {
  console.log("🔄 Syncing Categorized i18n resources...");

  const categories = {}; // { categoryName: { subPath: content } }

  function scan(dir) {
    const items = fs.readdirSync(dir);
    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        scan(fullPath);
      } else if (item === "index.json") {
        const relativePath = path.relative(EN_DIR, fullPath);
        const parts = relativePath.split(path.sep); // [category, sub1, sub2, ..., 'index.json']

        const category = parts[0];
        const subPathParts = parts.slice(1, -1);

        const content = JSON.parse(fs.readFileSync(fullPath, "utf8"));
        const sorted = sortObject(content);
        fs.writeFileSync(fullPath, JSON.stringify(sorted, null, 2));

        if (!categories[category]) categories[category] = {};

        // Build nested object structure for this category
        let current = categories[category];
        subPathParts.forEach((part, index) => {
          if (index === subPathParts.length - 1) {
            current[part] = sorted;
          } else {
            if (!current[part]) current[part] = {};
            current = current[part];
          }
        });

        // Handle case where file is directly in category folder (e.g., en/common/index.json)
        if (subPathParts.length === 0) {
          Object.assign(categories[category], sorted);
        }
      }
    });
  }
  scan(EN_DIR);

  const typeDefinitions = [];
  const resourcesInterfaces = [];

  Object.entries(categories).forEach(([category, structure]) => {
    const interfaceName = `${category.replace(/[^a-zA-Z0-9]/g, "_")}Keys`;
    typeDefinitions.push(`export interface ${interfaceName} {
${generateKeyTypes(structure).join("\n")}
}`);
    resourcesInterfaces.push(`  '${category}': ${interfaceName};`);
  });

  const typesContent = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * This file is updated by scripts/i18n/i18n-sync.js
 */

${typeDefinitions.join("\n\n")}

export interface TranslationResources {
${resourcesInterfaces.join("\n")}
}

export type TranslationNamespace = keyof TranslationResources;

export type NamespaceKeys<T extends TranslationNamespace> = keyof TranslationResources[T];

export type TranslationVariables<T extends TranslationNamespace, K extends NamespaceKeys<T>> = 
  TranslationResources[T][K];

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: TranslationResources;
  }
}
`;

  fs.writeFileSync(TYPES_FILE, typesContent);
  console.log(
    "✅ i18n sync complete. Categorized types generated in src/i18n/types.ts"
  );
}

try {
  sync();
} catch (error) {
  console.error("❌ Sync failed:", error);
  process.exit(1);
}
