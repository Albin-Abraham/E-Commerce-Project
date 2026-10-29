#!/usr/bin/env node

/**
 * Bundle budget gate - checks an EXISTING dist/ against size budgets.
 * Never runs a build; CI runs `pnpm build` first, then this script.
 *
 * Reads:
 *   dist/index.html                 entry <script>, modulepreload, stylesheet
 *   bundle-budgets.json             absolute budgets (see that file)
 *   <baseline bundle-report.json>   optional, for the growth check
 *
 * Writes:
 *   bundle-report.json              machine-readable report (CI artifact,
 *                                   also the input for release-report.mjs)
 *
 * Exit code:
 *   0  all budgets passed (or growth check skipped for lack of baseline)
 *   1  a budget was exceeded / dist is incomplete
 *
 * Usage:
 *   node scripts/bundle-budget.mjs
 *   node scripts/bundle-budget.mjs --dist=dist --baseline=baseline/bundle-report.json
 *   node scripts/bundle-budget.mjs --report=out/bundle-report.json
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, ...rest] = a.slice(2).split("=");
      return [k, rest.length > 0 ? rest.join("=") : true];
    })
);

const DIST = path.resolve(ROOT, String(args.dist ?? "dist"));
const BUDGETS_PATH = path.resolve(ROOT, String(args.budgets ?? "bundle-budgets.json"));
const REPORT_PATH = path.resolve(ROOT, String(args.report ?? "bundle-report.json"));
const BASELINE_PATH = args.baseline ? path.resolve(ROOT, String(args.baseline)) : null;

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function gzipSize(absPath) {
  return zlib.gzipSync(fs.readFileSync(absPath)).length;
}

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  fail(`No index.html in ${DIST}. Run the production build first (pnpm build).`);
}
if (!fs.existsSync(BUDGETS_PATH)) {
  fail(`Budgets file not found: ${BUDGETS_PATH}`);
}

const budgets = JSON.parse(fs.readFileSync(BUDGETS_PATH, "utf8"));
const html = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

// Entry assets = what the browser must fetch before first paint:
//   entry <script src>, modulepreloaded chunks, and linked stylesheets.
// /env.js is deliberately excluded - it is a tiny mutable runtime file, not a bundle.
const collect = (regex) =>
  [...html.matchAll(regex)]
    .map((m) => m[1])
    .filter((href) => !href.startsWith("data:") && !href.endsWith("/env.js"));

const entryJs = collect(/<script[^>]*\ssrc="([^"]+)"/g);
const preloadedJs = collect(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g);
const css = collect(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g);

const resolveInDist = (href) => path.join(DIST, href.replace(/^\//, ""));

const missing = [...entryJs, ...preloadedJs, ...css].filter(
  (href) => !fs.existsSync(resolveInDist(href))
);
if (missing.length > 0) {
  fail(
    `index.html references missing asset(s):\n    ${missing.join("\n    ")}\n` +
      `  The build output and index.html disagree - dist is incomplete.`
  );
}

const sumKb = (hrefs) =>
  Math.round(hrefs.reduce((sum, href) => sum + gzipSize(resolveInDist(href)), 0) / 102.4) / 10;

// Every generated bundle, for the chunk budget and the release-report diff.
const assetsDir = path.join(DIST, "assets");
const assets = fs.existsSync(assetsDir)
  ? fs
      .readdirSync(assetsDir)
      .filter((f) => fs.statSync(path.join(assetsDir, f)).isFile())
      .map((f) => ({
        file: `assets/${f}`,
        gzipKb: kb(gzipSize(path.join(assetsDir, f))),
      }))
      .sort((a, b) => b.gzipKb - a.gzipKb)
  : [];

const initialJsKb = sumKb([...entryJs, ...preloadedJs]);
const initialCssKb = sumKb(css);
const largestChunk = assets[0] ?? { file: "(none)", gzipKb: 0 };

// --- Baseline (growth check) -----------------------------------------------
let baseline = null;
let growth = null;
if (BASELINE_PATH) {
  if (fs.existsSync(BASELINE_PATH)) {
    baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
    const prev = baseline?.initial?.jsKb;
    if (typeof prev === "number" && prev > 0) {
      const deltaPct = Math.round(((initialJsKb - prev) / prev) * 1000) / 10;
      growth = {
        previousJsKb: prev,
        deltaPct,
        limitPct: budgets.maxInitialJsGrowthPct,
        passed: deltaPct <= budgets.maxInitialJsGrowthPct,
      };
    }
  } else {
    console.warn(
      `⚠️  Baseline not found at ${BASELINE_PATH} - skipping the growth check.\n` +
        `    (Cache eviction or a first run. Absolute budgets still apply.)`
    );
  }
}

// --- Evaluate ---------------------------------------------------------------
const results = [
  {
    name: "Initial JS (gzip)",
    value: initialJsKb,
    limit: budgets.initialJsGzipKb,
    passed: initialJsKb <= budgets.initialJsGzipKb,
  },
  {
    name: "Initial CSS (gzip)",
    value: initialCssKb,
    limit: budgets.initialCssGzipKb,
    passed: initialCssKb <= budgets.initialCssGzipKb,
  },
  {
    name: `Largest chunk (${largestChunk.file})`,
    value: largestChunk.gzipKb,
    limit: budgets.maxChunkGzipKb,
    passed: largestChunk.gzipKb <= budgets.maxChunkGzipKb,
  },
];
if (growth) {
  results.push({
    name: "Initial JS growth vs baseline",
    value: `${growth.deltaPct > 0 ? "+" : ""}${growth.deltaPct}%`,
    limit: `+${growth.limitPct}%`,
    passed: growth.passed,
  });
}

const budgetsPassed = results.every((r) => r.passed);

console.log("\nFrontend Bundle Budget Report");
console.log("-----------------------------");
for (const r of results) {
  console.log(`${r.name}: ${r.value} / ${r.limit}  ${r.passed ? "PASS" : "FAIL"}`);
}
console.log(`Entry chunks: ${entryJs.length} js, ${preloadedJs.length} preloaded, ${css.length} css`);
console.log(`Total assets: ${assets.length} files\n`);

const git = (cmd) => {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 30_000 }).trim();
  } catch {
    return null;
  }
};

const report = {
  commit: process.env.GITHUB_SHA ?? git("git rev-parse HEAD"),
  generatedAt: new Date().toISOString(),
  initial: { jsKb: initialJsKb, cssKb: initialCssKb },
  largestChunk,
  assets,
  baseline: baseline
    ? { commit: baseline.commit ?? null, release: baseline.release ?? null, initial: baseline.initial }
    : null,
  growth,
  checks: { budgetsPassed, growthPassed: growth ? growth.passed : null },
  results,
};

fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(`📄 Report written to ${path.relative(ROOT, REPORT_PATH)}`);

if (!budgetsPassed) {
  console.error("\n❌ Bundle budget exceeded. See results above.");
  console.error(
    `   If this growth is intentional, update ${BUDGETS_PATH.startsWith(ROOT) ? path.relative(ROOT, BUDGETS_PATH) : BUDGETS_PATH} in the same PR with a note in the description.`
  );
  process.exit(1);
}

console.log("✅ All bundle budgets passed\n");
