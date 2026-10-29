export interface NamingConventions {
  testFile: string;
  testSuite: string;
  testCase: string;
  driver: string;
  fixture: string;
  factory: string;
  capability: string;
}

export interface DefaultTimeouts {
  unit: number;
  component: number;
  integration: number;
  e2e: number;
  async: number;
  animation: number;
  network: number;
}

export interface QualityRequirements {
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  maxTestDuration: number;
  flakyTestRetries: number;
  requiredAssertions: number;
}

export interface GlobalPolicy {
  naming: NamingConventions;
  timeouts: DefaultTimeouts;
  quality: QualityRequirements;
  environment: {
    nodeVersion: string;
    browserTargets: string[];
    ci: boolean;
  };
  reporting: {
    formats: string[];
    outputDir: string;
    includeArtifacts: boolean;
  };
}

export const defaultGlobalPolicy: GlobalPolicy = {
  naming: {
    testFile: "*.test.{ts,tsx}",
    testSuite: "PascalCase",
    testCase: "camelCase",
    driver: "PascalCase + Driver suffix",
    fixture: "PascalCase + Fixture suffix",
    factory: "camelCase + Factory suffix",
    capability: "camelCase + Capability suffix",
  },
  timeouts: {
    unit: 5000,
    component: 10000,
    integration: 30000,
    e2e: 60000,
    async: 4000,
    animation: 1000,
    network: 10000,
  },
  quality: {
    coverage: {
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80,
    },
    maxTestDuration: 30000,
    flakyTestRetries: 2,
    requiredAssertions: 1,
  },
  environment: {
    nodeVersion: ">=20.0.0",
    browserTargets: ["chromium"],
    ci: process.env.CI === "true",
  },
  reporting: {
    formats: ["json", "html", "junit"],
    outputDir: "test-results",
    includeArtifacts: true,
  },
};

export function getGlobalPolicy(): GlobalPolicy {
  return defaultGlobalPolicy;
}

export function mergeGlobalPolicy(overrides: Partial<GlobalPolicy>): GlobalPolicy {
  return {
    ...defaultGlobalPolicy,
    ...overrides,
    naming: { ...defaultGlobalPolicy.naming, ...overrides.naming },
    timeouts: { ...defaultGlobalPolicy.timeouts, ...overrides.timeouts },
    quality: { ...defaultGlobalPolicy.quality, ...overrides.quality },
    environment: { ...defaultGlobalPolicy.environment, ...overrides.environment },
    reporting: { ...defaultGlobalPolicy.reporting, ...overrides.reporting },
  };
}

export const testProfiles = {
  unit: {
    name: "unit" as const,
    environment: "node" as const,
    externalDependencies: "none" as const,
    diagnostics: ["assertion-output"] as const,
    timeout: 5000,
    isolation: "full" as const,
    coverage: true,
  },
  component: {
    name: "component" as const,
    environment: "jsdom" as const,
    externalDependencies: "controlled" as const,
    diagnostics: ["dom", "component-errors", "accessibility"] as const,
    timeout: 10000,
    isolation: "full" as const,
    coverage: true,
  },
  integration: {
    name: "integration" as const,
    environment: "jsdom" as const,
    externalDependencies: "test-servers" as const,
    diagnostics: ["requests", "responses", "logs", "state"] as const,
    timeout: 30000,
    isolation: "shared-infrastructure" as const,
    coverage: true,
  },
  e2e: {
    name: "e2e" as const,
    environment: "browser" as const,
    externalDependencies: "controlled-app" as const,
    diagnostics: ["traces", "screenshots", "network", "console"] as const,
    timeout: 60000,
    isolation: "fresh-context" as const,
    coverage: false,
  },
} as const;

export type TestProfileName = keyof typeof testProfiles;
export type TestProfile = typeof testProfiles[TestProfileName];

export function getProfile(name: TestProfileName): TestProfile {
  return testProfiles[name];
}

export function getAllProfiles(): TestProfile[] {
  return Object.values(testProfiles);
}

export function getProfileTimeout(profile: TestProfileName): number {
  return testProfiles[profile].timeout;
}

export function getProfileEnvironment(profile: TestProfileName): TestProfile["environment"] {
  return testProfiles[profile].environment;
}

export function getProfileDiagnostics(profile: TestProfileName): TestProfile["diagnostics"] {
  return testProfiles[profile].diagnostics;
}

export function getProfileIsolation(profile: TestProfileName): TestProfile["isolation"] {
  return testProfiles[profile].isolation;
}