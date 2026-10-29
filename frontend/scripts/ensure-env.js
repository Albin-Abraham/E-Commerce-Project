#!/usr/bin/env node
/**
 * Materialises the `.env*` files that Vite reads from the version-controlled
 * sources. Every `.env*` path is gitignored, so a fresh clone has none of them
 * and `vite` (through the VITE_APP_ENV guard in vite.config.ts) cannot resolve
 * which profile to load.
 *
 *   .env.example            ->  .env                 (base config, all modes)
 *   docker/env/<mode>.env   ->  .env.<mode>          (mode overrides)
 *
 * Existing files are never overwritten unless --force is passed, so personal
 * overrides and any real secrets stay intact.
 *
 * Usage:
 *   node scripts/ensure-env.js            provision only what is missing
 *   node scripts/ensure-env.js --force    overwrite all
 *   node scripts/ensure-env.js --check    report only, non-zero if incomplete
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_SRC_DIR = path.join(ROOT, "docker", "env");
const BASE_SRC = path.join(ROOT, ".env.example");

const MODES = ["development", "test", "staging", "production"];

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const CHECK = args.includes("--check");

/** @type {{target: string, source: string}[]} */
const plan = [
  { target: path.join(ROOT, ".env"), source: BASE_SRC },
  ...MODES.map((mode) => ({
    target: path.join(ROOT, `.env.${mode}`),
    source: path.join(ENV_SRC_DIR, `${mode}.env`),
  })),
];

const missingSources = plan.filter(({ source }) => !fs.existsSync(source));
if (missingSources.length > 0) {
  console.error("❌ Cannot provision env files. Missing source(s):");
  for (const { source } of missingSources) {
    console.error(`   ${path.relative(ROOT, source)}`);
  }
  console.error(
    "\n   These are version-controlled. Reinstall or restore them."
  );
  process.exit(1);
}

if (CHECK) {
  const absent = plan.filter(({ target }) => !fs.existsSync(target));
  if (absent.length === 0) {
    console.log("✅ All env files present.");
    process.exit(0);
  }
  console.error("❌ Missing env file(s):");
  for (const { target } of absent) {
    console.error(`   ${path.relative(ROOT, target)}`);
  }
  console.error("\n   Run: pnpm env:init");
  process.exit(1);
}

let created = 0;
let kept = 0;

for (const { target, source } of plan) {
  if (fs.existsSync(target) && !FORCE) {
    kept += 1;
    continue;
  }
  fs.copyFileSync(source, target);
  created += 1;
}

if (created === 0) {
  console.log(
    `✅ Env files already provisioned (${kept} kept). Use --force to overwrite.`
  );
} else {
  console.log(
    `✅ Env files provisioned: ${created} created, ${kept} left untouched.`
  );
  if (kept > 0) {
    console.log("   Your local overrides were preserved.");
  }
}
