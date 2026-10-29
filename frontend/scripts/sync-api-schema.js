#!/usr/bin/env node
/**
 * Dynamic OpenAPI TypeScript Generator Script
 *
 * Reads API URL from environment variables (.env, .env.local, .env.development)
 * or falls back to standard dev port, avoiding hardcoded localhost endpoints.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const rootDir = process.cwd();

// Load environment files in order of precedence
const envFiles = [".env.local", ".env.development", ".env"];
for (const file of envFiles) {
  const envPath = path.join(rootDir, file);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

// Extract base API URL dynamically from environment
const rawBaseUrl =
  process.env.VITE_API_URL ||
  process.env.API_URL ||
  process.env.API_URL_STORYBOOK ||
  "http://localhost:8000";

const baseUrl = rawBaseUrl.replace(/\/+$/, "");
const schemaUrl = process.env.OPENAPI_SCHEMA_URL || `${baseUrl}/api/schema/`;
const outputPath = path.join(rootDir, "src/core/http/generated-api.d.ts");

// Check for local schema file first (e.g. Backend-RestFul/schema.yaml) for offline generation
const localBackendSchema = path.resolve(rootDir, "../../Backend-RestFul/schema.yaml");
const localApiSchemaJson = path.join(rootDir, "api-schema.json");

let inputSource = schemaUrl;
if (fs.existsSync(localBackendSchema)) {
  inputSource = localBackendSchema;
} else if (fs.existsSync(localApiSchemaJson)) {
  inputSource = localApiSchemaJson;
}


console.log(`📡 Using OpenAPI schema source: ${inputSource}`);
console.log(`📝 Target TypeScript definitions: ${outputPath}`);

try {
  execSync(`npx -y openapi-typescript "${inputSource}" --output "${outputPath}"`, {
    stdio: "inherit",
  });
  console.log("✅ Successfully generated API TypeScript types.");
} catch (error) {
  console.error("❌ Failed to sync OpenAPI schema:", error.message);
  process.exit(1);
}

