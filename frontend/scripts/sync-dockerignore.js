#!/usr/bin/env node
/**
 * Generates `.dockerignore` from `.gitignore`.
 *
 * Git and Docker read two different files with hardcoded different names, so
 * they can never literally be merged -- Docker will not read `.gitignore` and
 * git will not read `.dockerignore`. What we *can* do is stop maintaining the
 * same rules twice, which is how `.env.example` ended up excluded from the
 * build context while still being committed: the negation had been added to
 * `.gitignore` only, and the image build failed until it was duplicated here.
 *
 * So `.gitignore` is the single source of truth for everything git ignores, and
 * this script adds the handful of paths that only Docker cares about, then
 * mirrors the result into `.dockerignore`.
 *
 * Those Docker-only paths are kept in the script rather than in a marked block
 * inside `.gitignore` on purpose. Every line in `.gitignore` applies to git, so
 * a "docker only" block there would also ignore `.github/` and `.vscode/` --
 * both of which hold tracked content. That would silently block adding a new
 * workflow or re-adding `.vscode/extensions.json` while still working fine on
 * the current checkout, because gitignore does not apply to tracked files.
 *
 * Usage:
 *   node scripts/sync-dockerignore.js            write .dockerignore
 *   node scripts/sync-dockerignore.js --check    verify it is current, non-zero if not
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, ".gitignore");
const OUT = path.join(ROOT, ".dockerignore");

/**
 * Paths Docker must not receive that git has no reason to ignore -- several of
 * them are tracked on purpose.
 *
 * Emitted last so they win over any negation in `.gitignore`, notably
 * `!.vscode/extensions.json`. None of them match `.env.example`, so that
 * negation still holds.
 */
const DOCKER_ONLY = [
  ".git",
  ".github",
  ".vscode",
  ".storybook",
  "coverage",
  "*.tsbuildinfo",
];

const args = process.argv.slice(2);
const CHECK = args.includes("--check");

const isRule = (line) => line.trim() !== "" && !line.trim().startsWith("#");

/**
 * Minimal ordered gitignore matcher, used only to assert the env rules behave.
 * Supports `!` negation, `*` / `?` globs and a trailing `/`, which is all the
 * `.env*` rules need. This is deliberately not a general gitignore engine.
 */
function isExcluded(patterns, name) {
  let excluded = false;
  for (const raw of patterns) {
    const negated = raw.startsWith("!");
    const pattern = (negated ? raw.slice(1) : raw).replace(/\/$/, "");
    const body = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    if (new RegExp(`^${body}$`).test(name)) excluded = !negated;
  }
  return excluded;
}

/**
 * The env rules the image build depends on, as [probePath, mustBeExcluded].
 * `.env.example` must survive: the Dockerfile copies it to create `.env`.
 */
const ENV_EXPECTATIONS = [
  [".env", true],
  [".env.local", true],
  [".env.development", true],
  [".env.docker", true],
  [".env.example", false],
];

/**
 * Report any env probe whose verdict differs from what is required.
 * Returns the failures so the caller decides how loudly to complain.
 */
const envFailures = (rules) =>
  ENV_EXPECTATIONS.filter(([name, want]) => isExcluded(rules, name) !== want);

const build = (shared) =>
  [
    "# GENERATED FILE -- DO NOT EDIT BY HAND.",
    "#",
    "#   Source of truth:  .gitignore  +  DOCKER_ONLY in scripts/sync-dockerignore.js",
    "#   Regenerate:       pnpm dockerignore:sync",
    "#   Verify (CI):      pnpm dockerignore:check",
    "#",
    "# Git reads .gitignore; Docker reads .dockerignore. Both files are required.",
    "# This one must stay at the repository root because the build context is the",
    "# repository root (see `context: ..` in docker/docker-compose.yml), not docker/.",
    "",
    "# --- Mirrored from .gitignore ---",
    ...shared,
    "",
    "# --- Docker-only (from DOCKER_ONLY in scripts/sync-dockerignore.js) ---",
    "# Emitted last so they win over any negation above, e.g. !.vscode/extensions.json.",
    "# These are deliberately absent from .gitignore: several are tracked content.",
    ...DOCKER_ONLY,
    "",
  ].join("\n");

function main() {
  if (!fs.existsSync(SRC)) {
    console.error("❌ .gitignore not found.");
    return 1;
  }

  const shared = fs
    .readFileSync(SRC, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");

  // Assert behaviour rather than trusting the rules were mirrored in the right
  // order. Checked twice: once over the mirrored rules, so a bad edit to
  // .gitignore is reported as such, and once over the final order including
  // DOCKER_ONLY, so appending a rule here cannot quietly break the image build.
  const rules = shared.filter(isRule);
  const mirrored = envFailures(rules);
  if (mirrored.length > 0) {
    console.error(
      "❌ .gitignore no longer produces the env rules Docker needs:"
    );
    for (const [name, want] of mirrored) {
      console.error(`     ${name} should be ${want ? "excluded" : "kept"}`);
    }
    console.error(
      "   Fix the .env* block in .gitignore, then re-run this script."
    );
    return 1;
  }

  const appended = envFailures([...rules, ...DOCKER_ONLY]);
  if (appended.length > 0) {
    console.error(
      "❌ DOCKER_ONLY would break the env rules. Refusing to write:"
    );
    for (const [name, want] of appended) {
      console.error(`     ${name} would be ${want ? "kept" : "excluded"}`);
    }
    return 1;
  }

  const next = build(shared);
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : null;
  const stale = current !== next;

  if (CHECK) {
    if (!stale) {
      console.log("✅ .dockerignore is in sync with .gitignore.");
      return 0;
    }
    if (current === null) {
      console.error("❌ .dockerignore is missing. Run: pnpm dockerignore:sync");
    } else {
      const before = new Set(current.split("\n"));
      const after = new Set(next.split("\n"));
      const dropped = [...before].filter((l) => l && !after.has(l));
      const added = [...after].filter((l) => l && !before.has(l));
      console.error("❌ .dockerignore is out of date with .gitignore.");
      for (const l of dropped) console.error(`   - ${l}`);
      for (const l of added) console.error(`   + ${l}`);
      console.error("\n   Fix: pnpm dockerignore:sync");
    }
    return 1;
  }

  if (!stale) {
    console.log("✅ .dockerignore already up to date.");
    return 0;
  }

  fs.writeFileSync(OUT, next);
  console.log(
    `✅ .dockerignore generated from .gitignore ` +
      `(${rules.length} mirrored, ${DOCKER_ONLY.length} docker-only rules).`
  );
  return 0;
}

process.exit(main());
