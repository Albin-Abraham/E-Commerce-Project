export * from "./failure-classification";
export * from "./classifier";
export * from "./vitest-reporter";
export * from "./playwright-reporter";

import { getVitestFailureReporter } from "./vitest-reporter";
import { PlaywrightFailureReporter } from "./playwright-reporter";

export function createReportingCapability() {
  const vitestReporter = getVitestFailureReporter();
  
  return {
    vitest: vitestReporter,
    playwright: (outputDir?: string) => new PlaywrightFailureReporter(outputDir),
    getFailureReports: () => vitestReporter.getFailureReports(),
    getRunSummary: () => vitestReporter.getRunSummary(),
  };
}

export type ReportingCapability = ReturnType<typeof createReportingCapability>;