#!/usr/bin/env node

/**
 * Quality Gates Runner
 * 
 * Evaluates quality gates for all modules and reports overall status.
 */

import { spawnSync } from 'child_process';
import { resolve } from 'path';
import { qualityGates, evaluateQualityGate, qualityGateRegistry } from '../../src/shared/testing/quality-gates';

interface ModuleMetrics {
  coverage: { lines: number; functions: number; branches: number; statements: number };
  mutation?: { score: number } | null;
  execution: { duration: number };
  qualityFailures: string[];
}

async function collectMetrics(module: string): Promise<ModuleMetrics> {
  // Run vitest for the module to get coverage and execution time
  const startTime = Date.now();
  const coverageFile = resolve(process.cwd(), `test-results/coverage-${module}.json`);
  
  const result = spawnSync('npx', [
    'vitest',
    'run',
    '--project',
    module,
    '--coverage',
    '--reporter=json',
    `--outputFile=${coverageFile}`,
  ], {
    cwd: resolve(process.cwd()),
    encoding: 'utf-8',
    timeout: 120000,
  });
  const duration = Date.now() - startTime;

  // Parse coverage from output
  let coverage = { lines: 0, functions: 0, branches: 0, statements: 0 };
  try {
    const fs = await import('fs');
    if (fs.existsSync(coverageFile)) {
      const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf-8'));
      coverage = {
        lines: coverageData.total?.lines?.pct || 0,
        functions: coverageData.total?.functions?.pct || 0,
        branches: coverageData.total?.branches?.pct || 0,
        statements: coverageData.total?.statements?.pct || 0,
      };
    }
  } catch {
    // Ignore parsing errors
  }

  const qualityFailures: string[] = [];
  if (result.status !== 0) {
    qualityFailures.push(`Vitest exited with code ${result.status}`);
  }

  return {
    coverage,
    mutation: null,
    execution: { duration },
    qualityFailures,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const targetModule = args.find(a => a.startsWith('--module='))?.split('=')[1];
  const jsonOutput = args.includes('--json');
  const failFast = args.includes('--fail-fast');

  console.log('🚦 Quality Gates Evaluation\n');

  const modules = targetModule ? [targetModule] : qualityGateRegistry.getExecutionOrder();
  
  const results: Array<{ module: string; result: any }> = [];
  let overallPassed = true;

  for (const module of modules) {
    console.log(`\n📋 Evaluating ${module}...`);
    
    const gate = qualityGates.find(g => g.module === module);
    if (!gate) {
      console.log(`  ⚠️  No quality gate defined for ${module}`);
      continue;
    }

    console.log(`  Criticality: ${gate.criticality}`);
    console.log(`  Coverage targets: L:${gate.coverage.lines}% F:${gate.coverage.functions}% B:${gate.coverage.branches}% S:${gate.coverage.statements}%`);

    const metrics = await collectMetrics(module);
    const result = evaluateQualityGate(module, metrics);

    console.log(`  Actual coverage:  L:${metrics.coverage.lines}% F:${metrics.coverage.functions}% B:${metrics.coverage.branches}% S:${metrics.coverage.statements}%`);
    console.log(`  Execution time:   ${metrics.execution.duration}ms (max: ${gate.execution.maxDuration}ms)`);
    
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`  Status: ${status}`);
    
    if (!result.passed) {
      overallPassed = false;
      if (failFast) break;
    }
    
    results.push({ module, result });
  }

  // Summary
  console.log('\n=== Quality Gates Summary ===');
  for (const { module, result } of results) {
    console.log(`  ${result.passed ? '✅' : '❌'} ${module}`);
  }
  console.log(`\nOverall: ${overallPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);

  if (!overallPassed) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Quality gates evaluation failed:', err);
  process.exit(1);
});