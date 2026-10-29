export interface ArtifactPolicy {
  screenshots: {
    enabled: boolean;
    onFailure: boolean;
    onSuccess: boolean;
    fullPage: boolean;
    quality: number;
    format: "png" | "jpeg";
  };
  traces: {
    enabled: boolean;
    onFailure: boolean;
    onRetry: boolean;
    categories: string[];
  };
  console: {
    enabled: boolean;
    levels: Array<"log" | "warn" | "error" | "info" | "debug">;
    maxEntries: number;
  };
  network: {
    enabled: boolean;
    captureRequestBody: boolean;
    captureResponseBody: boolean;
    filterUrls?: string[];
  };
  dom: {
    enabled: boolean;
    includeStyles: boolean;
    maxDepth: number;
    onFailure: boolean;
  };
  videos: {
    enabled: boolean;
    onFailure: boolean;
    onRetry: boolean;
  };
}

export interface StoragePolicy {
  baseDir: string;
  structure: "flat" | "by-run" | "by-test" | "by-profile";
  retention: {
    maxRuns: number;
    maxAgeDays: number;
    maxSizeMB: number;
  };
  compression: boolean;
  naming: {
    runPrefix: string;
    testSeparator: string;
    artifactSeparator: string;
  };
}

export interface ReportingPolicy {
  formats: Array<"json" | "html" | "junit" | "tap" | "github">;
  includeArtifacts: boolean;
  artifactLinks: boolean;
  summary: {
    enabled: boolean;
    showPassed: boolean;
    showFailed: boolean;
    showSkipped: boolean;
    showDuration: boolean;
    showCoverage: boolean;
  };
  failureClassification: {
    enabled: boolean;
    categories: string[];
    autoClassify: boolean;
  };
}

export interface DiagnosticsPolicy {
  artifacts: ArtifactPolicy;
  storage: StoragePolicy;
  reporting: ReportingPolicy;
  ci: {
    failOnInfrastructureFailure: boolean;
    failOnConfigurationFailure: boolean;
    warnOnTimeout: boolean;
    warnOnUnknownFailure: boolean;
    uploadArtifacts: boolean;
    artifactStorage?: "s3" | "gcs" | "azure" | "local";
  };
  development: {
    autoOpenReport: boolean;
    watchMode: boolean;
    liveReload: boolean;
  };
}

export const defaultDiagnosticsPolicy: DiagnosticsPolicy = {
  artifacts: {
    screenshots: {
      enabled: true,
      onFailure: true,
      onSuccess: false,
      fullPage: true,
      quality: 80,
      format: "png",
    },
    traces: {
      enabled: true,
      onFailure: true,
      onRetry: true,
      categories: ["chromium", "firefox", "webkit"],
    },
    console: {
      enabled: true,
      levels: ["error", "warn", "info", "log", "debug"],
      maxEntries: 1000,
    },
    network: {
      enabled: true,
      captureRequestBody: true,
      captureResponseBody: true,
    },
    dom: {
      enabled: true,
      includeStyles: true,
      maxDepth: 10,
      onFailure: true,
    },
    videos: {
      enabled: false,
      onFailure: true,
      onRetry: true,
    },
  },
  storage: {
    baseDir: "test-results",
    structure: "by-run",
    retention: {
      maxRuns: 50,
      maxAgeDays: 30,
      maxSizeMB: 1024,
    },
    compression: true,
    naming: {
      runPrefix: "run-",
      testSeparator: "/",
      artifactSeparator: "_",
    },
  },
  reporting: {
    formats: ["json", "html", "junit"],
    includeArtifacts: true,
    artifactLinks: true,
    summary: {
      enabled: true,
      showPassed: true,
      showFailed: true,
      showSkipped: true,
      showDuration: true,
      showCoverage: true,
    },
    failureClassification: {
      enabled: true,
      categories: [
        "assertion",
        "application",
        "network",
        "timeout",
        "test-data",
        "test-infrastructure",
        "configuration",
        "environment",
        "unknown",
      ],
      autoClassify: true,
    },
  },
  ci: {
    failOnInfrastructureFailure: true,
    failOnConfigurationFailure: true,
    warnOnTimeout: true,
    warnOnUnknownFailure: true,
    uploadArtifacts: false,
  },
  development: {
    autoOpenReport: false,
    watchMode: true,
    liveReload: true,
  },
};

export function getDiagnosticsPolicy(): DiagnosticsPolicy {
  return defaultDiagnosticsPolicy;
}

export function mergeDiagnosticsPolicy(overrides: Partial<DiagnosticsPolicy>): DiagnosticsPolicy {
  return {
    ...defaultDiagnosticsPolicy,
    ...overrides,
    artifacts: { ...defaultDiagnosticsPolicy.artifacts, ...overrides.artifacts },
    storage: { ...defaultDiagnosticsPolicy.storage, ...overrides.storage },
    reporting: { ...defaultDiagnosticsPolicy.reporting, ...overrides.reporting },
    ci: { ...defaultDiagnosticsPolicy.ci, ...overrides.ci },
    development: { ...defaultDiagnosticsPolicy.development, ...overrides.development },
  };
}

export function getArtifactPath(
  policy: DiagnosticsPolicy,
  runId: string,
  testName: string,
  artifactName: string,
  extension: string
): string {
  const { baseDir, structure, naming } = policy.storage;
  const sanitizedTestName = testName.replace(/[^a-zA-Z0-9-_]/g, "-");
  
  switch (structure) {
    case "flat":
      return [baseDir, `${naming.runPrefix}${runId}${naming.artifactSeparator}${sanitizedTestName}${naming.artifactSeparator}${artifactName}.${extension}`].join("/");
    case "by-run":
      return [baseDir, `${naming.runPrefix}${runId}`, sanitizedTestName, `${artifactName}.${extension}`].join("/");
    case "by-test":
      return [baseDir, sanitizedTestName, `${naming.runPrefix}${runId}`, `${artifactName}.${extension}`].join("/");
    case "by-profile":
      return [baseDir, "default", `${naming.runPrefix}${runId}`, sanitizedTestName, `${artifactName}.${extension}`].join("/");
    default:
      return baseDir;
  }
}

export function shouldCollectArtifact(
  policy: DiagnosticsPolicy,
  artifactType: keyof ArtifactPolicy,
  testStatus: "passed" | "failed" | "skipped" | "retried"
): boolean {
  const artifactConfig = policy.artifacts[artifactType] as any;
  
  if (!artifactConfig.enabled) return false;
  
  if (testStatus === "failed" && artifactConfig.onFailure) return true;
  if (testStatus === "passed" && artifactConfig.onSuccess) return true;
  if (testStatus === "retried" && artifactConfig.onRetry) return true;
  
  return false;
}

export function getFailureCategories(policy: DiagnosticsPolicy): string[] {
  return policy.reporting.failureClassification.categories;
}

export function isFailureCategoryCritical(
  _policy: DiagnosticsPolicy,
  category: string
): boolean {
  return category === "test-infrastructure" || category === "configuration";
}

export function shouldFailBuild(
  policy: DiagnosticsPolicy,
  category: string
): boolean {
  if (category === "test-infrastructure") return policy.ci.failOnInfrastructureFailure;
  if (category === "configuration") return policy.ci.failOnConfigurationFailure;
  return false;
}

export function shouldWarn(
  policy: DiagnosticsPolicy,
  category: string
): boolean {
  if (category === "timeout") return policy.ci.warnOnTimeout;
  if (category === "unknown") return policy.ci.warnOnUnknownFailure;
  return false;
}