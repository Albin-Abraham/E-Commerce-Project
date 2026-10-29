#!/usr/bin/env node

/**
 * Automated Modular Test Context Report Generator
 *
 * Uses key-based placeholder templates to dynamically generate:
 * 1. Master Architecture Test Directory (docs/testing/reports/test-context-report.txt)
 * 2. Dedicated Domain Reports with distinct filenames (e.g. auth.feature-test-report.txt)
 * 3. In-Feature Co-located Reports (src/features/<domain>/testing/<domain>.feature-test-report.txt)
 *
 * Explicitly parses and distinguishes:
 * - TRACKED ISSUES (e.g. [ISSUE-1042], [FEAT-AUTH])
 * - BUGS & DEFECTS (e.g. [BUG-DETAIL-ENVELOPE], Regression [...], Security Guards)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../");
const SRC_DIR = path.join(ROOT_DIR, "src");
const OUTPUT_DIR = path.join(ROOT_DIR, "docs/testing/reports");
const TEMPLATES_DIR = path.join(ROOT_DIR, "docs/testing/templates");

const FILE_ENTRY_TEMPLATE_PATH = path.join(
  TEMPLATES_DIR,
  "test-file-entry.template.txt"
);
const DOMAIN_REPORT_TEMPLATE_PATH = path.join(
  TEMPLATES_DIR,
  "domain-report.template.txt"
);
const MASTER_REPORT_TEMPLATE_PATH = path.join(
  TEMPLATES_DIR,
  "master-report.template.txt"
);

function renderTemplate(template, vars) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? String(vars[key]) : match;
  });
}

function findTestFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git") {
        findTestFiles(fullPath, files);
      }
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx"))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function classifyLayer(filePath, content) {
  const relPath = path.relative(ROOT_DIR, filePath);

  if (content.includes("Regression [") || relPath.includes(".regression.")) {
    return "Regression";
  }
  if (
    relPath.includes("/domain/") ||
    (!content.includes("react") &&
      !content.includes("@testing-library") &&
      !content.includes("msw"))
  ) {
    return "Domain";
  }
  if (relPath.includes("/use-cases/") || relPath.includes("/application/")) {
    return "Application";
  }
  if (
    content.includes("msw") ||
    relPath.includes("/http/") ||
    relPath.includes("/services/")
  ) {
    return "Infrastructure";
  }
  return "Interface / Driver";
}

function classifyDomain(filePath) {
  const relPath = path.relative(SRC_DIR, filePath);
  const parts = relPath.split(path.sep);
  const top = parts[0];

  if (top === "features" && parts[1]) {
    const featureName = parts[1];
    return {
      group: "Features",
      domainKey: `features/${featureName}`,
      domainName: featureName,
      reportFileName: `${featureName}.feature-test-report.txt`,
      reportSubDir: `features/${featureName}`,
      inFeatureTestingDir: path.join(SRC_DIR, "features", featureName, "testing"),
    };
  }

  if (top === "core" && parts[1]) {
    const coreModule = parts[1];
    return {
      group: "Core",
      domainKey: `core/${coreModule}`,
      domainName: coreModule,
      reportFileName: `${coreModule}.core-test-report.txt`,
      reportSubDir: `core/${coreModule}`,
      inFeatureTestingDir: null,
    };
  }

  if (top === "shared") {
    if (parts[1] === "ui" && parts[2]) {
      const uiModule = parts[2];
      return {
        group: "Shared UI",
        domainKey: `shared/ui/${uiModule}`,
        domainName: `ui-${uiModule}`,
        reportFileName: `${uiModule}.ui-test-report.txt`,
        reportSubDir: `shared/${uiModule}`,
        inFeatureTestingDir: null,
      };
    }
    const sub = parts[1] || "general";
    return {
      group: "Shared",
      domainKey: `shared/${sub}`,
      domainName: sub,
      reportFileName: `${sub}.shared-test-report.txt`,
      reportSubDir: `shared/${sub}`,
      inFeatureTestingDir: null,
    };
  }

  if (top === "shell") {
    const sub = parts[1] || "app";
    return {
      group: "Shell",
      domainKey: `shell/${sub}`,
      domainName: sub,
      reportFileName: `shell-${sub}.test-report.txt`,
      reportSubDir: `shell/${sub}`,
      inFeatureTestingDir: null,
    };
  }

  return {
    group: "General",
    domainKey: top,
    domainName: top,
    reportFileName: `${top}.test-report.txt`,
    reportSubDir: top,
    inFeatureTestingDir: null,
  };
}

function detectHarness(content) {
  const parts = [];
  if (content.includes("@testing-library/react")) parts.push("RTL");
  if (content.includes("Driver")) parts.push("Driver");
  if (content.includes("msw")) parts.push("MSW");
  if (content.includes("axe(") || content.includes("expectAccessible"))
    parts.push("vitest-axe");

  if (parts.length === 0) return "Pure Vitest (Zero Mocks, Zero DOM)";
  return parts.join(" + ");
}

function extractFixtures(content) {
  const fixtures = [];
  const fixtureMatches = content.matchAll(
    /import\s+.*?(?:fixture|scenarios).*?\s+from\s+["'](.*?)["']/gi
  );
  for (const match of fixtureMatches) {
    fixtures.push(path.basename(match[1]));
  }
  return fixtures.length > 0 ? fixtures.join(", ") : "None";
}

function extractIssuesAndBugs(content) {
  const issues = new Set();
  const bugs = new Set();

  // 1. Explicit tags: [ISSUE-123], [BUG-456], [FEAT-789]
  for (const m of content.matchAll(/\[(ISSUE-[A-Za-z0-9_-]+)\]/gi)) {
    issues.add(m[1].toUpperCase());
  }
  for (const m of content.matchAll(/\[(BUG-[A-Za-z0-9_-]+)\]/gi)) {
    bugs.add(m[1].toUpperCase());
  }
  for (const m of content.matchAll(/\[(FEAT-[A-Za-z0-9_-]+)\]/gi)) {
    issues.add(m[1].toUpperCase());
  }

  // 2. Docstring annotations
  for (const m of content.matchAll(/@issue\s+\[?(ISSUE-[A-Za-z0-9_-]+)\]?/gi)) {
    issues.add(m[1].toUpperCase());
  }
  for (const m of content.matchAll(/@bug\s+\[?(BUG-[A-Za-z0-9_-]+)\]?/gi)) {
    bugs.add(m[1].toUpperCase());
  }

  // 3. Regression test patterns in describe/it blocks
  for (const m of content.matchAll(/Regression\s*\[(.*?)\]/gi)) {
    bugs.add(`Regression [${m[1]}]`);
  }
  if (
    content.includes("infinite loop") ||
    content.includes("Infinite Loop") ||
    content.includes("URL Sync Infinite Loop")
  ) {
    bugs.add("Defect Guard: URL Sync Infinite Loop Shield");
  }
  if (content.includes("detail") && content.includes("unwrap")) {
    bugs.add("Defect Guard: Backend Detail Envelope Unwrapping");
  }
  if (
    content.includes("allowPrototypes: false") ||
    content.includes("prototype pollution")
  ) {
    bugs.add("Security Guard: Prototype Pollution Shield");
  }
  if (content.includes("Maximum call stack size exceeded") || content.includes("call-stack") || content.includes("LSP fix")) {
    bugs.add("Defect Guard: Recursive Call-Stack Overflow Shield");
  }

  return {
    issues: Array.from(issues),
    bugs: Array.from(bugs),
  };
}

function extractTags(content) {
  const tags = new Set();
  const tagMatches = content.matchAll(/\[([A-Z0-9_-]{2,})\]/g);
  for (const match of tagMatches) {
    const val = match[1];
    if (
      !val.startsWith("ISSUE-") &&
      !val.startsWith("BUG-") &&
      !val.startsWith("FEAT-")
    ) {
      tags.add(`[${val}]`);
    }
  }
  return tags.size > 0 ? Array.from(tags).join(" ") : "None";
}

function extractPrimaryResponsibility(content, defaultTarget) {
  // Extract initial block docstring if present
  const docMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
  if (docMatch) {
    const lines = docMatch[1]
      .split("\n")
      .map((l) => l.replace(/^\s*\*\s?/, "").trim())
      .filter((l) => l && !l.startsWith("@"));
    if (lines.length > 0) {
      return lines.slice(0, 3).join("\n");
    }
  }

  // Extract first describe block
  const firstDescribe = content.match(/describe\(\s*["'`](.*?)["'`]/);
  if (firstDescribe) {
    return `Validates behavioral invariants for ${firstDescribe[1]}.`;
  }

  return `Comprehensive behavioral verification for ${defaultTarget}.`;
}

function extractScenarios(content) {
  const lines = content.split("\n");
  const scenarios = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith("describe(") ||
      trimmed.startsWith("describe.each(")
    ) {
      const match = trimmed.match(
        /describe(?:\.each\(.*?\))?\(\s*["'`](.*?)["'`]/
      );
      if (match) scenarios.push(`- describe("${match[1]}")`);
    } else if (trimmed.startsWith("it(") || trimmed.startsWith("it.each(")) {
      const match = trimmed.match(/it(?:\.each\(.*?\))?\(\s*["'`](.*?)["'`]/);
      if (match) scenarios.push(`  • it("${match[1]}")`);
    }
  }

  return scenarios.length > 0
    ? scenarios.join("\n")
    : "  (No explicit describe/it blocks extracted)";
}

function extractMswEndpoints(content) {
  const endpoints = [];
  const mswMatches = content.matchAll(
    /http\.(get|post|put|patch|delete)\(\s*["'`](.*?)["'`]/gi
  );
  for (const match of mswMatches) {
    endpoints.push(`- ${match[1].toUpperCase()} ${match[2]}`);
  }
  return endpoints.length > 0 ? endpoints.join("\n") : "None";
}

function generateReports() {
  // Load templates from disk
  const fileEntryTemplate = fs.readFileSync(FILE_ENTRY_TEMPLATE_PATH, "utf-8");
  const domainReportTemplate = fs.readFileSync(
    DOMAIN_REPORT_TEMPLATE_PATH,
    "utf-8"
  );
  const masterReportTemplate = fs.readFileSync(
    MASTER_REPORT_TEMPLATE_PATH,
    "utf-8"
  );

  const testFiles = findTestFiles(SRC_DIR).sort();
  const layerCounts = {
    Domain: 0,
    Application: 0,
    Infrastructure: 0,
    "Interface / Driver": 0,
    Regression: 0,
  };

  const domainGroups = new Map();
  const allParsed = [];
  let totalIssuesCount = 0;
  let totalBugsCount = 0;

  for (const filePath of testFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relPath = path.relative(ROOT_DIR, filePath);
    const layer = classifyLayer(filePath, content);
    const domain = classifyDomain(filePath);
    const targetSymbol = path.basename(filePath).replace(/\.test\.(ts|tsx)$/, "");

    layerCounts[layer] = (layerCounts[layer] || 0) + 1;

    const { issues, bugs } = extractIssuesAndBugs(content);
    totalIssuesCount += issues.length;
    totalBugsCount += bugs.length;

    const parsedItem = {
      filePath,
      relPath,
      layer,
      domain,
      targetSymbol,
      harness: detectHarness(content),
      fixtures: extractFixtures(content),
      issues,
      bugs,
      tags: extractTags(content),
      primaryResponsibility: extractPrimaryResponsibility(content, targetSymbol),
      scenarios: extractScenarios(content),
      mswEndpoints: extractMswEndpoints(content),
    };

    allParsed.push(parsedItem);

    if (!domainGroups.has(domain.domainKey)) {
      domainGroups.set(domain.domainKey, {
        domain,
        items: [],
      });
    }
    domainGroups.get(domain.domainKey).items.push(parsedItem);
  }

  // ── 1. Render Individual File Entries via Template ────────────────────────
  function renderFileEntry(item) {
    return renderTemplate(fileEntryTemplate, {
      FILE_PATH: item.relPath,
      ARCH_LAYER: item.layer,
      DOMAIN_KEY: item.domain.domainKey,
      TARGET_SYMBOL: item.targetSymbol,
      HARNESS: item.harness,
      FIXTURES_USED: item.fixtures,
      TRACKED_ISSUES:
        item.issues.length > 0 ? item.issues.join(", ") : "None",
      BUGS_DEFENDED: item.bugs.length > 0 ? item.bugs.join("; ") : "None",
      TAGS: item.tags,
      PRIMARY_RESPONSIBILITY: item.primaryResponsibility,
      SCENARIOS_TREE: item.scenarios,
      MSW_ENDPOINTS: item.mswEndpoints,
    });
  }

  // ── 2. Write Modular Domain Reports ───────────────────────────────────────
  const generatedReportsList = [];

  for (const [domainKey, groupData] of domainGroups.entries()) {
    const { domain, items } = groupData;
    const domainDir = path.join(OUTPUT_DIR, domain.reportSubDir);
    if (!fs.existsSync(domainDir)) {
      fs.mkdirSync(domainDir, { recursive: true });
    }

    const domainIssues = Array.from(new Set(items.flatMap((it) => it.issues)));
    const domainBugs = Array.from(new Set(items.flatMap((it) => it.bugs)));

    const fileEntriesText = items.map((it) => renderFileEntry(it)).join("\n");

    const domainReportContent = renderTemplate(domainReportTemplate, {
      DOMAIN_TITLE: domainKey.toUpperCase(),
      DOMAIN_KEY: domainKey,
      DOMAIN_GROUP: domain.group,
      REPORT_FILE_NAME: domain.reportFileName,
      GENERATED_AT: new Date().toISOString(),
      TOTAL_FILES: items.length,
      ISSUES_COUNT: domainIssues.length,
      TRACKED_ISSUES_LIST:
        domainIssues.length > 0 ? domainIssues.join(", ") : "None",
      BUGS_COUNT: domainBugs.length,
      DEFENDED_BUGS_LIST:
        domainBugs.length > 0 ? domainBugs.join("; ") : "None",
      FILE_ENTRIES: fileEntriesText,
    });

    // Write with distinct filename: e.g. auth.feature-test-report.txt
    const distinctReportPath = path.join(domainDir, domain.reportFileName);
    fs.writeFileSync(distinctReportPath, domainReportContent, "utf-8");

    // Also write standard test-context-report.txt in the same dir for tooling compatibility
    const standardReportPath = path.join(domainDir, "test-context-report.txt");
    fs.writeFileSync(standardReportPath, domainReportContent, "utf-8");

    generatedReportsList.push({
      key: domainKey,
      group: domain.group,
      fileName: domain.reportFileName,
      fileCount: items.length,
      issuesCount: domainIssues.length,
      bugsCount: domainBugs.length,
      relPath: path.relative(ROOT_DIR, distinctReportPath),
    });

    // ── 3. In-Feature Co-location (src/features/<domain>/testing/) ──────────
    if (domain.inFeatureTestingDir) {
      if (!fs.existsSync(domain.inFeatureTestingDir)) {
        fs.mkdirSync(domain.inFeatureTestingDir, { recursive: true });
      }
      const distinctFeaturePath = path.join(
        domain.inFeatureTestingDir,
        domain.reportFileName
      );
      fs.writeFileSync(distinctFeaturePath, domainReportContent, "utf-8");

      const standardFeaturePath = path.join(
        domain.inFeatureTestingDir,
        "test-context-report.txt"
      );
      fs.writeFileSync(standardFeaturePath, domainReportContent, "utf-8");
    }
  }

  // ── 4. Write Master Index Report ──────────────────────────────────────────
  const layerBreakdownText = [
    `#   - Domain:              ${layerCounts.Domain || 0}`,
    `#   - Application:         ${layerCounts.Application || 0}`,
    `#   - Infrastructure:      ${layerCounts.Infrastructure || 0}`,
    `#   - Interface / Driver:  ${layerCounts["Interface / Driver"] || 0}`,
    `#   - Regression:          ${layerCounts.Regression || 0}`,
  ].join("\n");

  const modularReportsIndexText = generatedReportsList
    .map(
      (r) =>
        `#   - [${r.group.padEnd(9)}] ${r.key.padEnd(24)} (${String(
          r.fileCount
        ).padStart(2)} files | ${r.issuesCount} issues | ${
          r.bugsCount
        } bugs) -> ${r.relPath}`
    )
    .join("\n");

  const allEntriesText = allParsed.map((it) => renderFileEntry(it)).join("\n");

  const masterContent = renderTemplate(masterReportTemplate, {
    GENERATED_AT: new Date().toISOString(),
    TOTAL_FILES: testFiles.length,
    TOTAL_ISSUES: totalIssuesCount,
    TOTAL_BUGS: totalBugsCount,
    LAYER_BREAKDOWN: layerBreakdownText,
    MODULAR_REPORTS_INDEX: modularReportsIndexText,
    ALL_ENTRIES: allEntriesText,
  });

  const masterFile = path.join(OUTPUT_DIR, "test-context-report.txt");
  const masterDistinctFile = path.join(OUTPUT_DIR, "master.test-context-report.txt");
  fs.writeFileSync(masterFile, masterContent, "utf-8");
  fs.writeFileSync(masterDistinctFile, masterContent, "utf-8");

  console.log(`✅ Template-Driven Modular Test Reports generated successfully!`);
  console.log(`📊 Total Test Files: ${testFiles.length} | Tracked Issues: ${totalIssuesCount} | Bugs Defended: ${totalBugsCount}`);
  console.log(`📁 Master Index: docs/testing/reports/test-context-report.txt`);
  console.log(`📁 Specialized Domain Reports Generated:`);
  generatedReportsList.forEach((r) => {
    console.log(
      `   • ${r.key} (${r.fileCount} suites, ${r.issuesCount} issues, ${r.bugsCount} bugs) -> ${r.relPath}`
    );
  });
}

generateReports();
