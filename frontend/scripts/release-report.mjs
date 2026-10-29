#!/usr/bin/env node

/**
 * Release report generator - the reporting role for change detection.
 *
 * It does NOT drive the build. Vite owns compilation; this script only
 * describes what changed between two builds and records which checks passed,
 * so the report can be kept as a CI/release artifact.
 *
 * Inputs:
 *   bundle-report.json               current build (from bundle-budget.mjs)
 *   baseline bundle-report.json      previous main build (restored CI cache)
 *   git metadata                     for changed source files
 *   check results                    passed by CI, the workflow knows them
 *
 * Output:
 *   release-report.json
 *
 * Usage:
 *   node scripts/release-report.mjs \
 *     --current=bundle-report.json \
 *     --baseline=baseline/bundle-report.json \
 *     --release=v123 \
 *     --tests=passed \
 *     --security=passed \
 *     --image-digest=sha256:...
 *
 * Exit code: 0 (report generation is informational; CI gates already ran).
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, ...rest] = a.slice(2).split("=");
      // `--flag` -> true; `--flag=value` -> value (kept even if empty, so a
      // failed build passing `--image-digest=` records "" not boolean true).
      return [k, rest.length > 0 ? rest.join("=") : true];
    })
);

const CURRENT_PATH = path.resolve(ROOT, String(args.current ?? "bundle-report.json"));
const OUTPUT_PATH = path.resolve(ROOT, String(args.output ?? "release-report.json"));
const BASELINE_PATH = args.baseline ? path.resolve(ROOT, String(args.baseline)) : null;

if (!fs.existsSync(CURRENT_PATH)) {
  console.error(
    `❌ Current bundle report not found: ${CURRENT_PATH}\n` +
      `   Run scripts/bundle-budget.mjs first.`
  );
  process.exit(1);
}

const current = JSON.parse(fs.readFileSync(CURRENT_PATH, "utf8"));
const baseline =
  BASELINE_PATH && fs.existsSync(BASELINE_PATH)
    ? JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"))
    : null;

const git = (cmd) => {
  try {
    // 30s timeout: git plumbing should never take longer, and a hung git
    // (lock contention, credential prompt) must not stall the CI job.
    return execSync(cmd, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
    }).trim();
  } catch {
    return null;
  }
};

// --- changedAssets: content-hashed filenames mean a content change shows up
// as one removed name + one added name.
const changedAssets = [];
if (baseline) {
  const prevNames = new Set((baseline.assets ?? []).map((a) => a.file));
  const currNames = new Set((current.assets ?? []).map((a) => a.file));
  for (const f of currNames) {
    if (!prevNames.has(f)) changedAssets.push({ file: f, status: "added" });
  }
  for (const f of prevNames) {
    if (!currNames.has(f)) changedAssets.push({ file: f, status: "removed" });
  }
}

// --- changedSourceFiles: diff from the baseline commit when it is resolvable,
// otherwise from the previous v* release tag, otherwise left empty with
// diffRange null so consumers know the range could not be established.
const diffRange = (() => {
  const base = baseline?.commit;
  if (base && git(`git cat-file -e ${base}^{commit}`) !== null) {
    return `${base}..HEAD`;
  }
  const prevTag = git(`git describe --tags --abbrev=0 --match "v*" HEAD`);
  if (prevTag && git(`git cat-file -e ${prevTag}^{commit}`) !== null) {
    return `${prevTag}..HEAD`;
  }
  return null;
})();

const changedSourceFiles = diffRange
  ? (git(`git diff --name-only ${diffRange}`) ?? "").split("\n").filter(Boolean)
  : [];

// --- previousRelease: what the baseline build was, if known.
const previousRelease = baseline
  ? {
      release: baseline.release ?? null,
      commit: baseline.commit ?? null,
      generatedAt: baseline.generatedAt ?? null,
      initial: baseline.initial ?? null,
    }
  : null;

// GitHub job/step results are "success" | "failure" | "skipped" | "cancelled";
// explicit CLI flags may say "passed"/"failed". Anything non-success is not a
// pass, and skipped/cancelled is unknown rather than failed.
const parseCheck = (value) => {
  if (value === undefined || value === null) return null;
  if (value === "skipped" || value === "cancelled") return null;
  return value === "success" || value === "passed" || value === "true" || value === true;
};

const report = {
  release: args.release ?? process.env.RELEASE_TAG ?? null,
  previousRelease,
  commit: process.env.GITHUB_SHA ?? current.commit ?? git("git rev-parse HEAD"),
  generatedAt: new Date().toISOString(),
  changedAssets,
  changedSourceFiles,
  diffRange,
  bundle: {
    initial: current.initial,
    largestChunk: current.largestChunk ?? null,
    assetCount: current.assets?.length ?? 0,
    baselineAssetCount: baseline?.assets?.length ?? null,
    deltaAssetCount: changedAssets.length || null,
  },
  checks: {
    testsPassed: parseCheck(args.tests),
    bundleBudgetPassed: current.checks?.budgetsPassed ?? parseCheck(args.budget),
    growthPassed: current.checks?.growthPassed ?? null,
    securityPassed: parseCheck(args.security),
    imageDigest: args["image-digest"] ?? null,
  },
};

fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(`📄 Release report written to ${path.relative(ROOT, OUTPUT_PATH)}`);
console.log(
  [
    `   release:      ${report.release ?? "(unversioned)"}`,
    `   previous:     ${previousRelease?.release ?? previousRelease?.commit ?? "(none - first report)"}`,
    `   source files: ${diffRange ? `${changedSourceFiles.length} changed (${diffRange})` : "unknown (no resolvable baseline or v* tag)"}`,
    `   assets:       ${changedAssets.length} added/removed`,
    `   checks:       tests=${report.checks.testsPassed} ` +
      `budget=${report.checks.bundleBudgetPassed} security=${report.checks.securityPassed}`,
  ].join("\n")
);
