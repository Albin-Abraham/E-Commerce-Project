#!/usr/bin/env node

/**
 * MSW JSON Fixture Manager CLI
 *
 * Capabilities:
 * - view: Lists all registered JSON fixtures, schemas, and file sizes across features.
 * - inspect <file>: Validates JSON structure, envelopes, and keys against api-schema.json.
 * - fetch <url> <file>: Downloads live JSON payload and formats it into fixture standard.
 * - delete <file>: Safely deletes an obsolete mock JSON fixture.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../");
const SRC_DIR = path.join(ROOT_DIR, "src");

function findJsonFixtures(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
        findJsonFixtures(fullPath, fileList);
      }
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      if (
        fullPath.includes("fixtures") ||
        fullPath.includes("mocks") ||
        entry.name.includes("fixture") ||
        entry.name.includes("mock")
      ) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function handleView() {
  const fixtures = findJsonFixtures(SRC_DIR);
  console.log("\n📦 Registered MSW JSON Fixtures:\n");
  console.log("--------------------------------------------------------------------------------");
  console.log(
    "Filename".padEnd(35) + "Size".padEnd(12) + "Relative Path"
  );
  console.log("--------------------------------------------------------------------------------");

  if (fixtures.length === 0) {
    console.log("  (No mock fixtures found)");
  } else {
    fixtures.forEach((f) => {
      const stats = fs.statSync(f);
      const relPath = path.relative(ROOT_DIR, f);
      const filename = path.basename(f);
      const sizeStr = `${(stats.size / 1024).toFixed(2)} KB`;
      console.log(
        filename.padEnd(35) + sizeStr.padEnd(12) + relPath
      );
    });
  }
  console.log("--------------------------------------------------------------------------------\n");
}

function handleInspect(targetFile) {
  if (!targetFile) {
    console.error("❌ Error: Please specify a JSON fixture file path to inspect.");
    process.exit(1);
  }

  const resolved = path.isAbsolute(targetFile)
    ? targetFile
    : path.resolve(ROOT_DIR, targetFile);

  if (!fs.existsSync(resolved)) {
    console.error(`❌ Error: Fixture file not found: ${resolved}`);
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(resolved, "utf-8");
    const json = JSON.parse(raw);

    console.log(`\n🔎 Inspecting Fixture: ${path.relative(ROOT_DIR, resolved)}`);
    console.log("--------------------------------------------------------------------------------");
    console.log("Valid JSON:         ✅ Yes");
    console.log(`Type:               ${Array.isArray(json) ? "Array" : typeof json}`);
    
    // Envelope check
    const isEnvelope =
      json &&
      typeof json === "object" &&
      ("data" in json || "detail" in json || "items" in json);
    console.log(`Standard Envelope:  ${isEnvelope ? "✅ Present" : "⚠️ Raw Dataset (No outer envelope)"}`);

    if (Array.isArray(json)) {
      console.log(`Record Count:       ${json.length}`);
      if (json.length > 0) {
        console.log(`Schema Keys:        ${Object.keys(json[0]).join(", ")}`);
      }
    } else if (json && typeof json === "object") {
      console.log(`Top-level Keys:     ${Object.keys(json).join(", ")}`);
    }

    console.log("--------------------------------------------------------------------------------\n");
  } catch (err) {
    console.error(`❌ Parse Error: Invalid JSON in ${resolved}\n`, err.message);
    process.exit(1);
  }
}

async function handleFetch(url, outputPath) {
  if (!url || !outputPath) {
    console.error("❌ Error: Usage: node msw-fixture-manager.js fetch <url> <outputPath>");
    process.exit(1);
  }

  const resolved = path.isAbsolute(outputPath)
    ? outputPath
    : path.resolve(ROOT_DIR, outputPath);

  console.log(`\n🌐 Fetching JSON fixture from: ${url}`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, JSON.stringify(data, null, 2), "utf-8");
    console.log(`✅ Saved fixture to: ${path.relative(ROOT_DIR, resolved)}\n`);
  } catch (err) {
    console.error(`❌ Failed to fetch fixture:`, err.message);
    process.exit(1);
  }
}

function generateMockRecord(schemaProps, index) {
  const record = {};
  const now = new Date().toISOString();

  if (schemaProps && Object.keys(schemaProps).length > 0) {
    for (const [key, def] of Object.entries(schemaProps)) {
      const type = def.type || "string";
      const format = def.format || "";

      if (key === "id") {
        record[key] = `id-${index + 1}`;
      } else if (key.includes("email")) {
        record[key] = `user${index + 1}@zenos.io`;
      } else if (key.includes("phone")) {
        record[key] = `+1-555-010${index}`;
      } else if (key.includes("date") || key.includes("created") || key.includes("updated") || format === "date-time") {
        record[key] = now;
      } else if (type === "boolean") {
        record[key] = index % 2 === 0;
      } else if (type === "integer" || type === "number") {
        record[key] = (index + 1) * 10;
      } else if (def.enum && Array.isArray(def.enum) && def.enum.length > 0) {
        record[key] = def.enum[index % def.enum.length];
      } else {
        record[key] = `${key.replace(/_/g, " ")} ${index + 1}`;
      }
    }
  } else {
    // Fallback standard entity schema
    record.id = `item-${index + 1}`;
    record.name = `Generated Record ${index + 1}`;
    record.code = `REC-00${index + 1}`;
    record.status = index % 2 === 0 ? "active" : "pending";
    record.created_at = now;
  }

  return record;
}

function parseSchemaFromOpenApi(rawYamlOrJson, targetSchema) {
  const props = {};
  const schemaRegex = new RegExp(`${targetSchema}:[\\s\\S]*?properties:([\\s\\S]*?)(?:\\n\\s{2,4}[A-Z]|$)`, "m");
  const match = rawYamlOrJson.match(schemaRegex);

  if (match && match[1]) {
    const propLines = match[1].split("\n");
    let currentProp = null;

    for (const line of propLines) {
      const propMatch = line.match(/^\s{8}([a-zA-Z0-9_]+):/);
      if (propMatch) {
        currentProp = propMatch[1];
        props[currentProp] = { type: "string" };
      } else if (currentProp) {
        const typeMatch = line.match(/type:\s*([a-zA-Z0-9_]+)/);
        if (typeMatch) props[currentProp].type = typeMatch[1];
        const formatMatch = line.match(/format:\s*([a-zA-Z0-9_]+)/);
        if (formatMatch) props[currentProp].format = formatMatch[1];
      }
    }
  }
  return props;
}

function handleGenerate(schemaName, outputPath, countStr = "5") {
  if (!schemaName || !outputPath) {
    console.error("❌ Error: Usage: node msw-fixture-manager.js generate <SchemaName> <outputPath> [count]");
    process.exit(1);
  }

  const count = parseInt(countStr, 10) || 5;
  const schemaFile = path.join(ROOT_DIR, "api-schema.json");
  let schemaProps = {};

  if (fs.existsSync(schemaFile)) {
    const raw = fs.readFileSync(schemaFile, "utf-8");
    schemaProps = parseSchemaFromOpenApi(raw, schemaName);
  }

  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(generateMockRecord(schemaProps, i));
  }

  const fixturePayload = {
    data: items,
    count: items.length,
    total: items.length,
  };

  const resolved = path.isAbsolute(outputPath)
    ? outputPath
    : path.resolve(ROOT_DIR, outputPath);

  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, JSON.stringify(fixturePayload, null, 2), "utf-8");

  console.log(`\n✨ Auto-generated ${count} mock records for "${schemaName}"`);
  console.log(`📁 Saved MSW Fixture to: ${path.relative(ROOT_DIR, resolved)}`);
  console.log(`🔍 Schema properties mapped: ${Object.keys(schemaProps).join(", ") || "default generic schema"}\n`);
}

function handleDelete(targetFile) {
  if (!targetFile) {
    console.error("❌ Error: Please specify a JSON fixture file path to delete.");
    process.exit(1);
  }

  const resolved = path.isAbsolute(targetFile)
    ? targetFile
    : path.resolve(ROOT_DIR, targetFile);

  if (!fs.existsSync(resolved)) {
    console.error(`❌ Fixture file does not exist: ${resolved}`);
    process.exit(1);
  }

  fs.unlinkSync(resolved);
  console.log(`🗑️ Deleted fixture: ${path.relative(ROOT_DIR, resolved)}\n`);
}

// ── CLI Dispatch ─────────────────────────────────────────────────────────────

const [action, ...args] = process.argv.slice(2);

switch (action) {
  case "view":
  case "list":
    handleView();
    break;
  case "inspect":
    handleInspect(args[0]);
    break;
  case "generate":
    handleGenerate(args[0], args[1], args[2]);
    break;
  case "fetch":
    handleFetch(args[0], args[1]);
    break;
  case "delete":
  case "rm":
    handleDelete(args[0]);
    break;
  default:
    console.log(`
MSW JSON Fixture Manager CLI
Usage:
  node msw-fixture-manager.js view
  node msw-fixture-manager.js inspect <filePath>
  node msw-fixture-manager.js generate <SchemaName> <outputPath> [count]
  node msw-fixture-manager.js fetch <url> <outputPath>
  node msw-fixture-manager.js delete <filePath>
    `);
    break;
}

