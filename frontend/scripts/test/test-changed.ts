#!/usr/bin/env node

/**
 * Test Changed - Wrapper for vitest with dependency-aware test selection
 * 
 * Usage:
 *   pnpm test:changed                    # Run tests affected by changes since HEAD~1
 *   pnpm test:changed --since=origin/main  # Compare against specific ref
 *   pnpm test:changed --json --output=affected.json  # Output JSON for CI
 */

import { spawnSync } from 'child_process';
import { resolve } from 'path';

function main() {
  return new Promise<void>((resolve, reject) => {
    const args = process.argv.slice(2);
    const rootDir = resolve(process.cwd());
    
    // Run dependency graph analysis
    const graphArgs = ['--import=tsx', 'scripts/test/dependency-graph.ts', ...args];
    const result = spawnSync('node', ['--import=tsx', ...graphArgs], {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    
    if (result.status !== 0) {
      console.error('Dependency analysis failed:', result.stderr?.toString());
      reject(new Error('Dependency analysis failed'));
      return;
    }
    
    const output = result.stdout?.toString().trim();
    
    // Parse affected tests from output
    const affectedTestsMatch = output.match(/Affected tests \((\d+)\):/);
    if (!affectedTestsMatch) {
      console.log('No affected tests found');
      resolve();
      return;
    }
    
    // Extract test files from output (lines after "Affected tests (N):")
    const lines = output.split('\n');
    const affectedStart = lines.findIndex(l => l.includes('Affected tests ('));
    const testFiles = lines
      .slice(affectedStart + 1)
      .filter(l => l.trim().startsWith('src/') && l.includes('.test.'))
      .map(l => l.trim());
  
    if (testFiles.length === 0) {
      console.log('No affected tests found');
      resolve();
      return;
    }
    
    console.log(`Running ${testFiles.length} affected tests...`);
    
    // Run vitest with affected tests
    const vitestArgs = ['vitest', 'run', ...testFiles];
    const vitestResult = spawnSync('npx', vitestArgs, {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: 'inherit',
    });
    
    process.exit(vitestResult.status ?? 0);
    resolve();
  });
}

main().catch(err => {
  console.error('Test changed failed:', err);
  process.exit(1);
});