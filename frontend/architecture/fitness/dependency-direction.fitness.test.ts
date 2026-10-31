/**
 * Architecture Fitness Test: Inward Dependency Direction
 *
 * Enforces Clean Architecture dependency rule:
 * presentation -> application -> domain <- infrastructure
 */

import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const FEATURES_DIR = path.resolve(__dirname, "../../src/features");

function findCleanArchModules(dir: string): string[] {
  let modules: string[] = [];
  if (!fs.existsSync(dir)) return modules;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subEntries = fs.readdirSync(fullPath);
      if (subEntries.includes("domain") && subEntries.includes("application")) {
        modules.push(fullPath);
      } else {
        modules = modules.concat(findCleanArchModules(fullPath));
      }
    }
  }
  return modules;
}

function getFiles(dir: string): string[] {
  let files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getFiles(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Architecture Fitness: Dependency Inversion Direction", () => {
  const cleanModules = findCleanArchModules(FEATURES_DIR);

  it("monitors clean architecture modules", () => {
    expect(cleanModules).toBeDefined();
  });

  for (const modDir of cleanModules) {
    const modName = path.relative(FEATURES_DIR, modDir);

    const domainFiles = getFiles(path.join(modDir, "domain"));
    for (const file of domainFiles) {
      const relative = path.relative(modDir, file);
      it(`[${modName}] domain layer in ${relative} has zero outward dependencies`, () => {
        const content = fs.readFileSync(file, "utf8");
        expect(content).not.toMatch(/from\s+['"].*application/);
        expect(content).not.toMatch(/from\s+['"].*infrastructure/);
        expect(content).not.toMatch(/from\s+['"].*presentation/);
      });
    }

    const appFiles = getFiles(path.join(modDir, "application"));
    for (const file of appFiles) {
      const relative = path.relative(modDir, file);
      it(`[${modName}] application layer in ${relative} does not import presentation or infrastructure`, () => {
        const content = fs.readFileSync(file, "utf8");
        expect(content).not.toMatch(/from\s+['"].*presentation/);
        expect(content).not.toMatch(/from\s+['"].*infrastructure/);
      });
    }
  }
});
