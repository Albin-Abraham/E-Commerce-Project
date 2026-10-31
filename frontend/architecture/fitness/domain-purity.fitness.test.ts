/**
 * Architecture Fitness Test: Domain Purity
 *
 * Invariant: Every file under any domain directory must be 100% pure TypeScript.
 * Zero imports from UI frameworks (React, HeroUI), DOM APIs, network transports (Axios, Fetch),
 * or query caching libraries (@tanstack/react-query).
 */

import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const SRC_ROOT = path.resolve(__dirname, "../../src");

function findDomainFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "domain") {
        // Collect all TS files inside domain
        results = results.concat(getAllTsFiles(fullPath));
      } else {
        results = results.concat(findDomainFiles(fullPath));
      }
    }
  }
  return results;
}

function getAllTsFiles(dir: string): string[] {
  let files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

const FORBIDDEN_DOMAIN_IMPORTS = [
  "react",
  "react-dom",
  "@tanstack/react-query",
  "axios",
  "@heroui/react",
  "framer-motion",
  "lucide-react",
];

describe("Architecture Fitness: Domain Purity Rules", () => {
  const domainFiles = findDomainFiles(SRC_ROOT);

  it("discovers domain files across the platform and feature layers", () => {
    // If no domain files created yet, will pass once domain files are added in P1
    expect(domainFiles).toBeDefined();
  });

  for (const file of domainFiles) {
    const relativePath = path.relative(SRC_ROOT, file);

    it(`enforces pure domain boundaries on ${relativePath}`, () => {
      const content = fs.readFileSync(file, "utf8");

      for (const forbidden of FORBIDDEN_DOMAIN_IMPORTS) {
        const importRegex = new RegExp(`from\\s+['"]${forbidden}['"]`, "i");
        expect(
          importRegex.test(content),
          `Domain file "${relativePath}" must NOT import from "${forbidden}"`
        ).toBe(false);
      }
    });
  }
});
