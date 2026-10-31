/**
 * Architecture Fitness Test: Platform Kernel Isolation
 *
 * Invariant: `src/platform/**` must NEVER import from `src/features/**` or `src/shared/ui/**`.
 * The platform kernel provides foundational runtime capabilities and must remain completely decoupled
 * from presentation widgets and business domains.
 */

import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const PLATFORM_DIR = path.resolve(__dirname, "../../src/platform");

function getAllTsFiles(dir: string): string[] {
  let files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "__tests__") {
      files = files.concat(getAllTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Architecture Fitness: Platform Kernel Isolation", () => {
  const platformFiles = getAllTsFiles(PLATFORM_DIR);

  it("verifies platform files exist", () => {
    expect(platformFiles.length).toBeGreaterThan(0);
  });

  for (const file of platformFiles) {
    const relativePath = path.relative(PLATFORM_DIR, file);

    it(`ensures ${relativePath} does not depend on features or UI`, () => {
      const content = fs.readFileSync(file, "utf8");

      expect(content).not.toMatch(/from\s+['"]@features/);
      expect(content).not.toMatch(/from\s+['"]@ui/);
      expect(content).not.toMatch(/from\s+['"]\.\.\/\.\.\/features/);
    });
  }
});
