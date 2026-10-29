import type { TestProfileName } from "./global-policy";

export interface RunnerConfig {
  name: "vitest" | "playwright";
  configPath?: string;
  globalSetup?: string;
  globalTeardown?: string;
  setupFiles?: string[];
  testMatch?: string[];
  exclude?: string[];
  timeout?: number;
  retries?: number;
  workers?: number | "auto";
  reporter?: any[];
  coverage?: boolean;
  coverageThresholds?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

export interface ProfileConfig {
  profile: TestProfileName;
  runner: RunnerConfig;
  capabilities: string[];
  isolation: "full" | "shared-infrastructure" | "fresh-context";
  fixtures: string[];
  factories: string[];
  networkMocking: "msw" | "none" | "custom";
  diagnostics: string[];
  qualityGates: {
    coverage?: boolean;
    linting?: boolean;
    typecheck?: boolean;
    maxDuration?: number;
  };
}

export const profileConfigs: Record<TestProfileName, ProfileConfig> = {
  unit: {
    profile: "unit",
    runner: {
      name: "vitest",
      configPath: "vitest.config.ts",
      setupFiles: ["vitest.setup.ts"],
      testMatch: ["**/*.test.ts", "**/*.test.tsx"],
      exclude: ["**/e2e/**", "**/*.spec.ts"],
      timeout: 5000,
      retries: 0,
      workers: "auto",
      coverage: true,
      coverageThresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
    capabilities: ["queries", "interactions", "assertions", "async"],
    isolation: "full",
    fixtures: [],
    factories: [],
    networkMocking: "msw",
    diagnostics: ["assertion-output"],
    qualityGates: {
      coverage: true,
      linting: true,
      typecheck: true,
      maxDuration: 5000,
    },
  },
  component: {
    profile: "component",
    runner: {
      name: "vitest",
      configPath: "vitest.config.ts",
      setupFiles: ["vitest.setup.ts"],
      testMatch: ["**/*.test.tsx"],
      exclude: ["**/e2e/**", "**/*.spec.ts", "**/__tests__/**"],
      timeout: 10000,
      retries: 1,
      workers: "auto",
      coverage: true,
      coverageThresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
    capabilities: ["queries", "interactions", "assertions", "async", "diagnostics"],
    isolation: "full",
    fixtures: ["component-fixtures"],
    factories: ["component-factories"],
    networkMocking: "msw",
    diagnostics: ["dom", "component-errors", "accessibility"],
    qualityGates: {
      coverage: true,
      linting: true,
      typecheck: true,
      maxDuration: 10000,
    },
  },
  integration: {
    profile: "integration",
    runner: {
      name: "vitest",
      configPath: "vitest.config.ts",
      setupFiles: ["vitest.setup.ts"],
      testMatch: ["**/integration/**/*.test.ts", "**/integration/**/*.test.tsx"],
      timeout: 30000,
      retries: 1,
      workers: 2,
      coverage: true,
      coverageThresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    capabilities: ["queries", "interactions", "assertions", "async", "diagnostics"],
    isolation: "shared-infrastructure",
    fixtures: ["integration-fixtures", "api-fixtures"],
    factories: ["integration-factories"],
    networkMocking: "msw",
    diagnostics: ["requests", "responses", "logs", "state"],
    qualityGates: {
      coverage: true,
      linting: true,
      typecheck: true,
      maxDuration: 30000,
    },
  },
  e2e: {
    profile: "e2e",
    runner: {
      name: "playwright",
      configPath: "playwright.config.ts",
      globalSetup: "e2e/global-setup.ts",
      globalTeardown: "e2e/global-teardown.ts",
      testMatch: ["e2e/**/*.spec.ts"],
      timeout: 60000,
      retries: 2,
      workers: 1,
      reporter: [
        ["list"],
        ["html", { outputFolder: "test-results/e2e/html", open: "never" }],
        ["json", { outputFile: "test-results/e2e/report.json" }],
      ],
      coverage: false,
    },
    capabilities: ["queries", "interactions", "assertions", "async", "diagnostics"],
    isolation: "fresh-context",
    fixtures: ["e2e-fixtures", "auth-fixtures"],
    factories: ["e2e-factories"],
    networkMocking: "msw",
    diagnostics: ["traces", "screenshots", "network", "console"],
    qualityGates: {
      coverage: false,
      linting: true,
      typecheck: true,
      maxDuration: 60000,
    },
  },
};

export function getProfileConfig(profile: TestProfileName): ProfileConfig {
  return profileConfigs[profile];
}

export function getRunnerConfig(profile: TestProfileName): RunnerConfig {
  return profileConfigs[profile].runner;
}

export function getProfileCapabilities(profile: TestProfileName): string[] {
  return profileConfigs[profile].capabilities;
}

export function getProfileIsolation(profile: TestProfileName): ProfileConfig["isolation"] {
  return profileConfigs[profile].isolation;
}

export function getProfileFixtures(profile: TestProfileName): string[] {
  return profileConfigs[profile].fixtures;
}

export function getProfileFactories(profile: TestProfileName): string[] {
  return profileConfigs[profile].factories;
}

export function getProfileNetworkMocking(profile: TestProfileName): ProfileConfig["networkMocking"] {
  return profileConfigs[profile].networkMocking;
}

export function getProfileDiagnostics(profile: TestProfileName): string[] {
  return profileConfigs[profile].diagnostics;
}

export function getProfileQualityGates(profile: TestProfileName): ProfileConfig["qualityGates"] {
  return profileConfigs[profile].qualityGates;
}

export function createCustomProfile(
  name: TestProfileName,
  overrides: Partial<ProfileConfig>
): ProfileConfig {
  const base = profileConfigs[name];
  return {
    ...base,
    ...overrides,
    runner: { ...base.runner, ...overrides.runner },
    qualityGates: { ...base.qualityGates, ...overrides.qualityGates },
  };
}

export function validateProfileConfig(config: ProfileConfig): string[] {
  const errors: string[] = [];
  
  if (!config.profile) {
    errors.push("Profile name is required");
  }
  
  if (!config.runner) {
    errors.push("Runner configuration is required");
  }
  
  if (!config.capabilities || config.capabilities.length === 0) {
    errors.push("At least one capability is required");
  }
  
  if (!["full", "shared-infrastructure", "fresh-context"].includes(config.isolation)) {
    errors.push("Invalid isolation level");
  }
  
  if (!["msw", "none", "custom"].includes(config.networkMocking)) {
    errors.push("Invalid network mocking strategy");
  }
  
  return errors;
}

export const profileMatrix = {
  unit: {
    useFor: ["pure functions", "hooks", "utilities", "state machines", "validators"],
    avoidFor: ["DOM interactions", "network calls", "browser APIs"],
  },
  component: {
    useFor: ["React components", "forms", "tables", "dialogs", "hooks with DOM"],
    avoidFor: ["full app flows", "cross-component state", "real network"],
  },
  integration: {
    useFor: ["API integration", "multi-component flows", "routing", "state management"],
    avoidFor: ["visual regression", "real browser behavior", "performance"],
  },
  e2e: {
    useFor: ["critical user journeys", "auth flows", "multi-page workflows", "visual validation"],
    avoidFor: ["unit logic", "component internals", "high-volume testing"],
  },
} as const;