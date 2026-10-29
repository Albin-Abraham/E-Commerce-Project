export * from "./types";
export * from "./impl/artifact-collector";

import type { DiagnosticArtifact, ScreenshotOptions, ArtifactCollectionOptions, FailureArtifactOptions } from "./types";
import * as artifactCollector from "./impl/artifact-collector";

export function createDiagnosticsCapability(container?: HTMLElement) {
  return {
    // Console Capture
    startConsoleCapture: () => artifactCollector.startConsoleCapture(),
    stopConsoleCapture: () => artifactCollector.stopConsoleCapture(),
    getConsoleLogs: () => artifactCollector.getConsoleLogs(),
    clearConsoleLogs: () => artifactCollector.clearConsoleLogs(),
    
    // Network Capture
    startNetworkCapture: () => artifactCollector.startNetworkCapture(),
    stopNetworkCapture: () => artifactCollector.stopNetworkCapture(),
    getNetworkRequests: () => artifactCollector.getNetworkRequests(),
    clearNetworkRequests: () => artifactCollector.clearNetworkRequests(),
    
    // Screenshots & Traces (require Playwright page/context)
    captureScreenshot: (page: any, options?: ScreenshotOptions) =>
      artifactCollector.captureScreenshot(page, options),
    captureTrace: (context: any, options?: { name?: string }) =>
      artifactCollector.captureTrace(context, options),
    
    // DOM & Page Capture
    captureDomSnapshot: (options?: { includeStyles?: boolean; maxDepth?: number }) =>
      artifactCollector.captureDomSnapshot(container, options),
    capturePageHtml: () => artifactCollector.capturePageHtml(),
    capturePageState: () => artifactCollector.capturePageState(),
    
    // Artifact Collection
    collectTestArtifacts: (options: ArtifactCollectionOptions) =>
      artifactCollector.collectTestArtifacts(options),
    collectFailureArtifacts: (options: FailureArtifactOptions) =>
      artifactCollector.collectFailureArtifacts(options),
    captureFailureSnapshot: (page: any, context: any, options: FailureArtifactOptions) =>
      artifactCollector.captureFailureSnapshot(page, context, options),
    
    // Artifact Management
    getArtifacts: (testId: string) => artifactCollector.getArtifacts(testId),
    clearArtifacts: (testId: string) => artifactCollector.clearArtifacts(testId),
    clearAllArtifacts: () => artifactCollector.clearAllArtifacts(),
    saveArtifact: (artifact: DiagnosticArtifact, outputDir: string) =>
      artifactCollector.saveArtifact(artifact, outputDir),
  };
}

export type DiagnosticsCapability = ReturnType<typeof createDiagnosticsCapability>;