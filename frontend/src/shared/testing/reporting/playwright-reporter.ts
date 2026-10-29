import type { FailureReport } from "./failure-classification";
import { createFailureReport, shouldFailBuild, shouldWarn } from "./classifier";
import type { TestCase, TestResult, FullResult } from "@playwright/test/reporter";

const failureReports: FailureReport[] = [];
let runStartTime = Date.now();
let runId = `e2e-run-${Date.now()}`;

export class PlaywrightFailureReporter {
  private outputDir: string;
  
  constructor(outputDir: string = "./test-results/failures") {
    this.outputDir = outputDir;
  }
  
  onBegin(_config: any, _suite: any): void {
    runStartTime = Date.now();
    runId = `e2e-run-${Date.now()}`;
    failureReports.length = 0;
  }
  
  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === "failed" && result.error) {
      const report = createFailureReport({
        error: {
          name: "PlaywrightError",
          message: result.error.message || "",
          stack: result.error.stack,
        },
        testName: test.title,
        testId: test.id,
        runner: "playwright",
        // page would be available from test fixtures
      });
      
      failureReports.push(report);
      
      console.log(`[E2E Failure Classification] ${test.title}: ${report.category}`);
      
      if (shouldFailBuild(report.category)) {
        this.saveFailureArtifact(report, test);
      }
    }
  }
  
  onEnd(result: FullResult): void {
    const duration = Date.now() - runStartTime;
    const failuresByCategory: Record<string, number> = {};
    const stats = (result as any).stats || { expected: 0, unexpected: 0, flaky: 0, skipped: 0 };
    
    for (const report of failureReports) {
      failuresByCategory[report.category] = (failuresByCategory[report.category] || 0) + 1;
    }
    
    console.log(`[E2E Test Run Summary] ${runId}: ${failureReports.length} failures`);
    console.log("Failures by category:", failuresByCategory);
    
    const criticalFailures = failureReports.filter(r => shouldFailBuild(r.category));
    if (criticalFailures.length > 0) {
      console.error(`[CRITICAL] ${criticalFailures.length} E2E test-infrastructure/configuration failures!`);
    }
    
    const warnings = failureReports.filter(r => shouldWarn(r.category));
    if (warnings.length > 0) {
      console.warn(`[WARNING] ${warnings.length} E2E timeout/unknown failures`);
    }
    
    this.saveRunSummary(runId, {
      runId,
      timestamp: runStartTime,
      totalTests: (stats.expected || 0) + (stats.unexpected || 0) + (stats.flaky || 0),
      passed: stats.expected || 0,
      failed: stats.unexpected || 0,
      skipped: stats.skipped || 0,
      flaky: stats.flaky || 0,
      failuresByCategory,
      duration,
    });
  }
  
  private saveFailureArtifact(report: FailureReport, test: TestCase): void {
    const fs = require("fs");
    const path = require("path");
    
    const outputDir = path.join(process.cwd(), this.outputDir, test.title.replace(/[^a-zA-Z0-9]/g, "-"));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const artifactPath = path.join(outputDir, `failure-${report.timestamp}.json`);
    fs.writeFileSync(artifactPath, JSON.stringify(report, null, 2));
  }
  
  private saveRunSummary(runId: string, summary: any): void {
    const fs = require("fs");
    const path = require("path");
    
    const outputDir = path.join(process.cwd(), "test-results", "e2e");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const summaryPath = path.join(outputDir, `${runId}-summary.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  }
  
  getFailureReports(): FailureReport[] {
    return [...failureReports];
  }
}

export default PlaywrightFailureReporter;