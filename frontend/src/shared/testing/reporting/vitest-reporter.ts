import type { FailureReport } from "./failure-classification";
import { createFailureReport, shouldFailBuild, shouldWarn } from "./classifier";
import { getCurrentTestContext } from "../test-context";

// Global state - shared within the worker process via globalThis
const GLOBAL_KEY = "__zenos_vitest_reporter__";

interface ReporterState {
  runStartTime: number;
  runId: string;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  failureReports: FailureReport[];
  initialized: boolean;
  reporterInstance?: any;
}

function getGlobalState(): ReporterState {
  const g = globalThis as any;
  if (!g[GLOBAL_KEY]) {
    console.log(`[DEBUG] getGlobalState: creating new globalThis[GLOBAL_KEY]`);
    g[GLOBAL_KEY] = {
      runStartTime: Date.now(),
      runId: `run-${Date.now()}`,
      passedCount: 0,
      failedCount: 0,
      skippedCount: 0,
      failureReports: [],
      initialized: false,
      reporterInstance: null,
    };
  } else {
    console.log(`[DEBUG] getGlobalState: using existing globalThis[GLOBAL_KEY], reporterInstance: ${g[GLOBAL_KEY].reporterInstance ? 'exists' : 'null'}`);
  }
  return g[GLOBAL_KEY] as ReporterState;
}

export function resetCounters(): void {
  const state = getGlobalState();
  // Only initialize once per worker process
  if (state.initialized) {
    console.log(`[DEBUG] resetCounters skipped - already initialized`);
    return;
  }
  state.passedCount = 0;
  state.failedCount = 0;
  state.skippedCount = 0;
  state.failureReports.length = 0;
  state.runStartTime = Date.now();
  state.runId = `run-${Date.now()}`;
  state.initialized = true;
  console.log(`[DEBUG] resetCounters called, initialized set to true`);
}

let existingReporter: any = null;

export function getVitestFailureReporter() {
  // Check module-level singleton first (fastest)
  if (existingReporter) {
    console.log(`[DEBUG] getVitestFailureReporter called, returning existing reporter (module)`);
    return existingReporter;
  }
  
  // Check globalThis for cross-module sharing within same context
  const state = getGlobalState();
  if (state.reporterInstance) {
    console.log(`[DEBUG] getVitestFailureReporter called, returning existing reporter (globalThis)`);
    existingReporter = state.reporterInstance;
    return existingReporter;
  }
  
  console.log(`[DEBUG] getVitestFailureReporter called, creating new reporter instance`);
  
  const reporter = {
    onTestRunStart: () => {
      console.log(`[DEBUG] onTestRunStart called`);
      // State already initialized in getVitestFailureReporter
    },
    
    onTestCaseResult: (testCase: any) => {
      const result = testCase.result();
      const state = getGlobalState();
      console.log(`[DEBUG] onTestCaseResult called: ${testCase.name}, state: ${result.state}, passedCount: ${state.passedCount}, failedCount: ${state.failedCount}`);
      
      if (result.state === "pass") {
        state.passedCount++;
        console.log(`[DEBUG] passedCount incremented to: ${state.passedCount}`);
      } else if (result.state === "failed") {
        console.log(`[DEBUG] Entering fail block for: ${testCase.name}`);
        state.failedCount++;
        console.log(`[DEBUG] failedCount incremented to: ${state.failedCount}`);
        const error = result.errors?.[0];
        if (error) {
          console.log(`[DEBUG] Error found: ${error.message}`);
          const _context = getCurrentTestContext();
          
          const report = createFailureReport({
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name,
            } as Error,
            testName: testCase.name,
            testId: testCase.id,
            runner: "vitest",
          });
          
          state.failureReports.push(report);
          
          // Log the classification
          console.log(`[Failure Classification] ${testCase.name}: ${report.category}`);
          
          // Save to artifact if critical
          if (shouldFailBuild(report.category)) {
            saveFailureArtifact(report);
          }
        } else {
          console.log(`[DEBUG] No error in result.errors`);
        }
      } else if (result.state === "skip") {
        state.skippedCount++;
      }
    },
    
    onTestRunEnd: (_testModules: any, _unhandledErrors: any, _reason: any) => {
      const state = getGlobalState();
      const summary = generateRunSummary(state);
      console.log(`[Test Run Summary] ${summary.runId}: ${summary.passed}/${summary.totalTests} passed, ${summary.failed} failed, ${summary.skipped} skipped`);
      
      if (summary.failed > 0) {
        console.log("Failures by category:", summary.failuresByCategory);
      }
      
      // Check for critical failures
      const criticalFailures = state.failureReports.filter(r => shouldFailBuild(r.category));
      if (criticalFailures.length > 0) {
        console.error(`[CRITICAL] ${criticalFailures.length} test-infrastructure/configuration failures detected!`);
        process.exitCode = 1;
      }
      
      const warnings = state.failureReports.filter(r => shouldWarn(r.category));
      if (warnings.length > 0) {
        console.warn(`[WARNING] ${warnings.length} timeout/unknown failures detected`);
      }
    },
    
    getFailureReports: () => [...getGlobalState().failureReports],
    getRunSummary: () => generateRunSummary(getGlobalState()),
  };
  
  state.reporterInstance = reporter;
  return reporter;
}

function generateRunSummary(state: ReporterState) {
  const duration = Date.now() - state.runStartTime;
  const failuresByCategory: Record<string, number> = {};
  
  for (const report of state.failureReports) {
    failuresByCategory[report.category] = (failuresByCategory[report.category] || 0) + 1;
  }
  
  return {
    runId: state.runId,
    timestamp: state.runStartTime,
    totalTests: state.passedCount + state.failedCount + state.skippedCount,
    passed: state.passedCount,
    failed: state.failedCount,
    skipped: state.skippedCount,
    failuresByCategory,
    duration,
  };
}

function saveFailureArtifact(report: FailureReport): void {
  const fs = require("fs");
  const path = require("path");
  
  const outputDir = path.join(process.cwd(), "test-results", "failures", report.testName.replace(/\s+/g, "-"));
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const artifactPath = path.join(outputDir, `failure-${report.timestamp}.json`);
  fs.writeFileSync(artifactPath, JSON.stringify(report, null, 2));
}

export function resetFailureReports(): void {
  const state = getGlobalState();
  state.failureReports.length = 0;
}