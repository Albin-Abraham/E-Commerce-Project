/**
 * Coverage Diff Tracking
 * 
 * Tracks coverage changes between commits and provides diff reporting.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

export interface CoverageData {
  lines: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
  statements: { total: number; covered: number; pct: number };
}

export interface CoverageDiff {
  lines: { current: number; previous: number; diff: number };
  functions: { current: number; previous: number; diff: number };
  branches: { current: number; previous: number; diff: number };
  statements: { current: number; previous: number; diff: number };
}

export interface CoverageReport {
  timestamp: string;
  commit: string;
  branch: string;
  overall: CoverageData;
  perFile: Record<string, CoverageData>;
  diff?: CoverageDiff;
}

const COVERAGE_HISTORY_DIR = '.coverage-history';
const COVERAGE_BASELINE_FILE = 'coverage-baseline.json';

export class CoverageTracker {
  private historyDir: string;
  private baselineFile: string;

  constructor(projectRoot: string = process.cwd()) {
    this.historyDir = resolve(projectRoot, COVERAGE_HISTORY_DIR);
    this.baselineFile = resolve(projectRoot, COVERAGE_BASELINE_FILE);
    
    if (!existsSync(this.historyDir)) {
      mkdirSync(this.historyDir, { recursive: true });
    }
  }

  /**
   * Load coverage data from vitest coverage output
   */
  loadCurrentCoverage(coverageDir: string = 'coverage'): CoverageData | null {
    const summaryFile = resolve(coverageDir, 'coverage-summary.json');
    if (!existsSync(summaryFile)) {
      console.warn(`Coverage summary not found at ${summaryFile}`);
      return null;
    }

    const data = JSON.parse(readFileSync(summaryFile, 'utf-8'));
    const total = data.total;

    return {
      lines: { total: total.lines.total, covered: total.lines.covered, pct: total.lines.pct },
      functions: { total: total.functions.total, covered: total.functions.covered, pct: total.functions.pct },
      branches: { total: total.branches.total, covered: total.branches.covered, pct: total.branches.pct },
      statements: { total: total.statements.total, covered: total.statements.covered, pct: total.statements.pct },
    };
  }

  /**
   * Load previous coverage from history
   */
  loadPreviousCoverage(commit?: string): CoverageData | null {
    if (commit) {
      const commitFile = resolve(this.historyDir, `${commit}.json`);
      if (existsSync(commitFile)) {
        return JSON.parse(readFileSync(commitFile, 'utf-8')).overall;
      }
    }

    // Fallback to baseline
    if (existsSync(this.baselineFile)) {
      return JSON.parse(readFileSync(this.baselineFile, 'utf-8')).overall;
    }

    // Fallback to most recent history
    const historyFiles = readdirSync(this.historyDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();

    if (historyFiles.length > 0) {
      const latest = resolve(this.historyDir, historyFiles[0]);
      return JSON.parse(readFileSync(latest, 'utf-8')).overall;
    }

    return null;
  }

  /**
   * Calculate diff between current and previous coverage
   */
  calculateDiff(current: CoverageData, previous: CoverageData | null): CoverageDiff | null {
    if (!previous) return null;

    return {
      lines: { current: current.lines.pct, previous: previous.lines.pct, diff: current.lines.pct - previous.lines.pct },
      functions: { current: current.functions.pct, previous: previous.functions.pct, diff: current.functions.pct - previous.functions.pct },
      branches: { current: current.branches.pct, previous: previous.branches.pct, diff: current.branches.pct - previous.branches.pct },
      statements: { current: current.statements.pct, previous: previous.statements.pct, diff: current.statements.pct - previous.statements.pct },
    };
  }

  /**
   * Save current coverage to history
   */
  saveCoverage(commit: string, branch: string, coverage: CoverageData, perFile?: Record<string, any>): void {
    const report: CoverageReport = {
      timestamp: new Date().toISOString(),
      commit,
      branch,
      overall: coverage,
      perFile: perFile || {},
    };

    const commitFile = resolve(this.historyDir, `${commit}.json`);
    writeFileSync(commitFile, JSON.stringify(report, null, 2));

    // Also update baseline if this is main branch
    const branchName = process.env.GITHUB_REF_NAME || process.env.BRANCH_NAME || 'main';
    if (branchName === 'main' || branchName === 'master') {
      writeFileSync(this.baselineFile, JSON.stringify({ overall: coverage }, null, 2));
    }
  }

  /**
   * Generate diff report
   */
  generateDiffReport(diff: CoverageDiff | null): string {
    if (!diff) return 'No previous coverage data to compare';

    const lines = [
      '# Coverage Diff Report',
      '',
      '| Metric | Current | Previous | Diff | Status |',
      '|--------|---------|----------|------|--------|',
    ];

    for (const [metric, data] of Object.entries(diff)) {
      const status = data.diff > 0 ? '✅ Improved' : data.diff < 0 ? '❌ Regressed' : '➡️ Unchanged';
      const diffStr = data.diff > 0 ? `+${data.diff.toFixed(2)}%` : `${data.diff.toFixed(2)}%`;
      
      lines.push(`| ${metric.charAt(0).toUpperCase() + metric.slice(1)} | ${data.current.toFixed(2)}% | ${data.previous.toFixed(2)}% | ${diffStr} | ${status} |`);
    }

    return lines.join('\n');
  }

  /**
   * Check if coverage meets thresholds
   */
  checkThresholds(coverage: CoverageData, thresholds: { lines: number; functions: number; branches: number; statements: number }): { passed: boolean; failures: string[] } {
    const failures: string[] = [];

    if (coverage.lines.pct < thresholds.lines) {
      failures.push(`Lines: ${coverage.lines.pct.toFixed(2)}% < ${thresholds.lines}%`);
    }
    if (coverage.functions.pct < thresholds.functions) {
      failures.push(`Functions: ${coverage.functions.pct.toFixed(2)}% < ${thresholds.functions}%`);
    }
    if (coverage.branches.pct < thresholds.branches) {
      failures.push(`Branches: ${coverage.branches.pct.toFixed(2)}% < ${thresholds.branches}%`);
    }
    if (coverage.statements.pct < thresholds.statements) {
      failures.push(`Statements: ${coverage.statements.pct.toFixed(2)}% < ${thresholds.statements}%`);
    }

    return { passed: failures.length === 0, failures };
  }
}

// --- Git Integration ---

export async function getCurrentCommit(): Promise<string> {
  const { spawnSync } = require('child_process');
  const result = require('child_process').spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8', timeout: 30_000 });
  return result.stdout?.trim() || 'unknown';
}

export async function getCurrentBranch(): Promise<string> {
  const { spawnSync } = require('child_process');
  const result = require('child_process').spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf-8', timeout: 30_000 });
  return result.stdout?.trim() || 'unknown';
}

// --- CLI ---

export async function runCoverageDiff(): Promise<void> {
  const tracker = new CoverageTracker();
  
  const current = tracker.loadCurrentCoverage();
  if (!current) {
    console.error('No current coverage data found');
    process.exit(1);
  }

  const commit = await getCurrentCommit();
  const branch = await getCurrentBranch();
  const previous = tracker.loadPreviousCoverage();
  const diff = tracker.calculateDiff(current, previous);

  console.log('\n=== Coverage Report ===');
  console.log(`Commit: ${commit}`);
  console.log(`Branch: ${branch}`);
  console.log('\nCurrent Coverage:');
  console.log(`  Lines:       ${current.lines.pct.toFixed(2)}%`);
  console.log(`  Functions:   ${current.functions.pct.toFixed(2)}%`);
  console.log(`  Branches:    ${current.branches.pct.toFixed(2)}%`);
  console.log(`  Statements:  ${current.statements.pct.toFixed(2)}%`);

  if (diff) {
    console.log('\nDiff vs Previous:');
    console.log(tracker.generateDiffReport(diff));
  }

  tracker.saveCoverage(await getCurrentCommit(), await getCurrentBranch(), current);
  
  // Check thresholds from vitest config
  const thresholds = { lines: 80, functions: 80, branches: 70, statements: 80 };
  const { passed, failures } = tracker.checkThresholds(current, thresholds);
  
  if (!passed) {
    console.log('\n❌ Coverage thresholds not met:');
    failures.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  } else {
    console.log('\n✅ All coverage thresholds met');
  }
}