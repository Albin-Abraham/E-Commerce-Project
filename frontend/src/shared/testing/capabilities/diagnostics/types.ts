export interface DiagnosticArtifact {
  name: string;
  type: "screenshot" | "trace" | "console" | "network" | "dom" | "json" | "html" | "text";
  content: string | Buffer | Uint8Array;
  timestamp: number;
  testId: string;
  metadata?: Record<string, any>;
}

export interface ScreenshotOptions {
  fullPage?: boolean;
  quality?: number;
  format?: "png" | "jpeg";
  clip?: { x: number; y: number; width: number; height: number };
}

export interface TraceOptions {
  name?: string;
  categories?: string[];
}

export interface ConsoleLogEntry {
  level: "log" | "warn" | "error" | "info" | "debug";
  args: any[];
  timestamp: number;
}

export interface NetworkRequestEntry {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  response?: {
    status: number;
    headers: Record<string, string>;
    body?: string;
  };
  timing: {
    start: number;
    end: number;
    duration: number;
  };
}

export interface DomSnapshotOptions {
  includeStyles?: boolean;
  includeShadowDOM?: boolean;
  maxDepth?: number;
}

export interface ArtifactCollectionOptions {
  testId: string;
  testName: string;
  outputDir?: string;
  collectConsole?: boolean;
  collectNetwork?: boolean;
  collectDom?: boolean;
  collectScreenshots?: boolean;
  collectTraces?: boolean;
}

export interface FailureArtifactOptions {
  testId: string;
  testName: string;
  error: Error;
  category: string;
  outputDir?: string;
}