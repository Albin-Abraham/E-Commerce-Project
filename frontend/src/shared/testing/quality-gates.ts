/**
 * Quality Gates Matrix - Per-Module Quality Targets
 * 
 * Defines quality gates for each module/project with realistic thresholds.
 * Based on actual coverage analysis and business criticality.
 */

export interface QualityGateConfig {
  module: string;
  displayName: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  
  // Coverage thresholds (per-module, based on actual achievable levels)
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  
  // Mutation testing
  mutation: {
    enabled: boolean;
    threshold: number; // minimum mutation score
    criticalPaths: string[]; // paths that must have high mutation score
  };
  
  // Test execution
  execution: {
    maxDuration: number; // ms
    timeout: number; // ms
    retries: number;
    parallel: boolean;
  };
  
  // Quality requirements
  quality: {
    requireLinting: boolean;
    requireTypecheck: boolean;
    requireAccessibility: boolean;
    requireVisualRegression: boolean;
    requireContractTests: boolean;
    maxFlakyTests: number;
  };
  
  // Dependencies
  dependencies: {
    runsAfter?: string[]; // modules that must pass first
    requiredServices?: string[]; // MSW, database, etc.
  };
}

export const qualityGates: QualityGateConfig[] = [
  // Core Infrastructure - Critical
  {
    module: 'form-core',
    displayName: 'Form Engine Core',
    criticality: 'critical',
    coverage: { lines: 25, functions: 45, branches: 55, statements: 25 },
    mutation: {
      enabled: true,
      threshold: 60,
      criticalPaths: ['src/core/form-core/engine.ts', 'src/core/form-core/validation-registry.ts', 'src/core/form-core/modules/validator.ts'],
    },
    execution: { maxDuration: 30000, timeout: 30000, retries: 0, parallel: true },
    quality: { requireLinting: true, requireTypecheck: true, requireAccessibility: true, requireVisualRegression: false, requireContractTests: false, maxFlakyTests: 0 },
    dependencies: { requiredServices: ['msw'] },
  },
  
  {
    module: 'table-core',
    displayName: 'Table Engine Core',
    criticality: 'critical',
    coverage: { lines: 20, functions: 40, branches: 50, statements: 20 },
    mutation: {
      enabled: true,
      threshold: 60,
      criticalPaths: ['src/core/table-core/table-engine.ts', 'src/core/table-core/modules/validator.ts', 'src/core/table-core/modules/filter.ts'],
    },
    execution: { maxDuration: 30000, timeout: 30000, retries: 0, parallel: true },
    quality: { requireLinting: true, requireTypecheck: true, requireAccessibility: true, requireVisualRegression: false, requireContractTests: false, maxFlakyTests: 0 },
    dependencies: { requiredServices: ['msw'] },
  },

  // Shared Testing Infrastructure - High
  {
    module: 'shared-testing',
    displayName: 'Testing Infrastructure',
    criticality: 'high',
    coverage: { lines: 0, functions: 0, branches: 0, statements: 0 }, // disabled
    mutation: { enabled: false, threshold: 0, criticalPaths: [] },
    execution: { maxDuration: 30000, timeout: 30000, retries: 0, parallel: true },
    quality: { requireLinting: true, requireTypecheck: true, requireAccessibility: false, requireVisualRegression: false, requireContractTests: false, maxFlakyTests: 0 },
    dependencies: { requiredServices: ['msw'] },
  },

  // UI Components - High
  {
    module: 'component',
    displayName: 'UI Components',
    criticality: 'high',
    coverage: { lines: 35, functions: 35, branches: 30, statements: 35 },
    mutation: {
      enabled: true,
      threshold: 50,
      criticalPaths: ['src/shared/ui/form/components/', 'src/shared/ui/table/ui/components/'],
    },
    execution: { maxDuration: 10000, timeout: 10000, retries: 1, parallel: true },
    quality: { requireLinting: true, requireTypecheck: true, requireAccessibility: true, requireVisualRegression: true, requireContractTests: false, maxFlakyTests: 2 },
    dependencies: { runsAfter: ['form-core', 'table-core'], requiredServices: ['msw'] },
  },

  // Integration Tests - Medium
  {
    module: 'integration',
    displayName: 'Integration Tests',
    criticality: 'medium',
    coverage: { lines: 30, functions: 30, branches: 25, statements: 30 },
    mutation: { enabled: false, threshold: 0, criticalPaths: [] },
    execution: { maxDuration: 60000, timeout: 60000, retries: 1, parallel: false },
    quality: { requireLinting: true, requireTypecheck: true, requireAccessibility: true, requireVisualRegression: false, requireContractTests: true, maxFlakyTests: 3 },
    dependencies: { runsAfter: ['form-core', 'table-core', 'component'], requiredServices: ['msw'] },
  },

  // MDAP (Model-Driven Architecture Patterns) - Medium
  {
    module: 'mdap',
    displayName: 'MDAP Compiler & Workflows',
    criticality: 'medium',
    coverage: { lines: 40, functions: 40, branches: 35, statements: 40 },
    mutation: { enabled: true, threshold: 50, criticalPaths: ['src/shared/ui/form/tests/mdap/', 'src/shared/ui/table/mdap/'] },
    execution: { maxDuration: 30000, timeout: 30000, retries: 1, parallel: true },
    quality: { requireLinting: true, requireTypecheck: true, requireAccessibility: true, requireVisualRegression: false, requireContractTests: false, maxFlakyTests: 1 },
    dependencies: { requiredServices: ['msw'] },
  },

  // Unit Tests - Foundation
  {
    module: 'unit',
    displayName: 'Unit Tests',
    criticality: 'high',
    coverage: { lines: 55, functions: 55, branches: 45, statements: 55 },
    mutation: { enabled: true, threshold: 70, criticalPaths: ['src/core/', 'src/shared/hooks/', 'src/shared/utils/'] },
    execution: { maxDuration: 5000, timeout: 5000, retries: 0, parallel: true },
    quality: { requireLinting: true, requireTypecheck: true, requireAccessibility: false, requireVisualRegression: false, requireContractTests: false, maxFlakyTests: 0 },
    dependencies: {},
  },
];

// --- Quality Gate Evaluation ---

export interface QualityGateResult {
  module: string;
  passed: boolean;
  coverage: {
    lines: { actual: number; target: number; passed: boolean };
    functions: { actual: number; target: number; passed: boolean };
    branches: { actual: number; target: number; passed: boolean };
    statements: { actual: number; target: number; passed: boolean };
  };
  mutation: { score: number; target: number; passed: boolean } | null;
  execution: { duration: number; maxDuration: number; passed: boolean };
  quality: { passed: boolean; failures: string[] };
  overall: boolean;
}

export function evaluateQualityGate(
  module: string,
  metrics: {
    coverage: { lines: number; functions: number; branches: number; statements: number };
    mutation?: { score: number } | null;
    execution: { duration: number };
    qualityFailures: string[];
  }
): QualityGateResult {
  const gate = qualityGates.find(g => g.module === module);
  if (!gate) {
    throw new Error(`No quality gate defined for module: ${module}`);
  }

  const coveragePassed = 
    metrics.coverage.lines >= gate.coverage.lines &&
    metrics.coverage.functions >= gate.coverage.functions &&
    metrics.coverage.branches >= gate.coverage.branches &&
    metrics.coverage.statements >= gate.coverage.statements;

  const mutationPassed = gate.mutation.enabled 
    ? (metrics.mutation?.score || 0) >= gate.mutation.threshold
    : true;

  const executionPassed = metrics.execution.duration <= gate.execution.maxDuration;
  const qualityPassed = metrics.qualityFailures.length === 0;

  const overall = coveragePassed && mutationPassed && executionPassed && qualityPassed;

  return {
    module,
    passed: overall,
    coverage: {
      lines: { actual: 0, target: gate.coverage.lines, passed: metrics.coverage.lines >= gate.coverage.lines },
      functions: { actual: 0, target: gate.coverage.functions, passed: metrics.coverage.functions >= gate.coverage.functions },
      branches: { actual: 0, target: gate.coverage.branches, passed: metrics.coverage.branches >= gate.coverage.branches },
      statements: { actual: 0, target: gate.coverage.statements, passed: metrics.coverage.statements >= gate.coverage.statements },
    },
    mutation: gate.mutation.enabled ? { score: metrics.mutation?.score || 0, target: gate.mutation.threshold, passed: mutationPassed } : null,
    execution: { duration: metrics.execution.duration, maxDuration: gate.execution.maxDuration, passed: executionPassed },
    quality: { passed: qualityPassed, failures: metrics.qualityFailures },
    overall,
  };
}

// --- Gate Registry ---

export const qualityGateRegistry = {
  gates: qualityGates,
  evaluate: evaluateQualityGate,
  
  getGate: (module: string) => qualityGates.find(g => g.module === module),
  
  getCriticalModules: () => qualityGates.filter(g => g.criticality === 'critical').map(g => g.module),
  
  getModulesByCriticality: (criticality: 'critical' | 'high' | 'medium' | 'low') => 
    qualityGates.filter(g => g.criticality === criticality).map(g => g.module),
  
  getExecutionOrder: () => {
    // Sort by dependencies and criticality
    const sorted = [...qualityGates].sort((a, b) => {
      // Critical first
      const criticalityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (criticalityOrder[a.criticality] !== criticalityOrder[b.criticality]) {
        return criticalityOrder[a.criticality] - criticalityOrder[b.criticality];
      }
      // Then by dependencies
      const aDeps = a.dependencies.runsAfter?.length || 0;
      const bDeps = b.dependencies.runsAfter?.length || 0;
      return aDeps - bDeps;
    });
    return sorted.map(g => g.module);
  },
  
  getParallelGroups: () => {
    const order = qualityGateRegistry.getExecutionOrder();
    const groups: string[][] = [];
    const processed = new Set<string>();
    
    for (const module of order) {
      const gate = qualityGates.find(g => g.module === module)!;
      const deps = gate.dependencies.runsAfter || [];
      const unmetDeps = deps.filter(d => !processed.has(d));
      
      if (unmetDeps.length === 0) {
        // Can run in current group
        if (groups.length === 0) groups.push([]);
        groups[groups.length - 1].push(module);
      } else {
        // Need new group
        groups.push([module]);
      }
      processed.add(module);
    }
    
    return groups;
  },
};