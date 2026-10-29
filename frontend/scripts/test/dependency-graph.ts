#!/usr/bin/env node

/**
 * Dependency-Aware Test Selection
 * 
 * Analyzes TypeScript import graph to determine which tests are affected by changed files.
 * Supports both file-level and package-level impact analysis.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, relative, extname, basename, dirname } from 'path';
import { spawnSync } from 'child_process';

interface DependencyNode {
  file: string;
  imports: string[];
  importedBy: string[];
  isTest: boolean;
  package?: string;
}

interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  testFileMap: Map<string, string[]>; // source file -> test files
  packageMap: Map<string, string[]>; // package -> files
}

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const TEST_PATTERNS = ['.test.', '.spec.', '__tests__/'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', 'coverage', '.vitest'];

function isTestFile(file: string): boolean {
  return TEST_PATTERNS.some(pattern => file.includes(pattern));
}

function getAllSourceFiles(rootDir: string): string[] {
  const files: string[] = [];
  
  function walk(dir: string) {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = resolve(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(entry) && !entry.startsWith('.')) {
          walk(fullPath);
        }
      } else if (EXTENSIONS.includes(extname(entry))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(rootDir);
  return files;
}

function parseImports(content: string, filePath: string): string[] {
  const imports: string[] = [];
  
  // Match ES6 imports: import ... from '...'
  const importRegex = /import\s+(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    // Skip external packages (not starting with . or @/)
    if (importPath.startsWith('.') || importPath.startsWith('@/')) {
      imports.push(importPath);
    }
  }
  
  // Match dynamic imports: import('...')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.') || importPath.startsWith('@/')) {
      imports.push(importPath);
    }
  }
  
  // Match require() calls
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.') || importPath.startsWith('@/')) {
      imports.push(importPath);
    }
  }
  
  return imports;
}

function resolveImportPath(importPath: string, fromFile: string, rootDir: string): string | null {
  const fromDir = dirname(fromFile);
  
  // Handle alias imports
  let resolvedPath = importPath;
  if (importPath.startsWith('@/')) {
    resolvedPath = resolve(rootDir, 'src', importPath.slice(2));
  } else if (importPath.startsWith('@')) {
    // Handle other aliases like @core, @shared, etc.
    const aliasMap: Record<string, string> = {
      '@core': 'src/core',
      '@shared': 'src/shared',
      '@shell': 'src/shell',
      '@features': 'src/features',
      '@ui': 'src/shared/ui',
      '@components': 'src/shared/ui',
      '@hooks': 'src/shared/hooks',
      '@utils': 'src/shared/utils',
      '@constants': 'src/shared/constants',
      '@assets': 'src/shared/assets',
      '@styles': 'src/shared/styles',
      '@testing': 'src/shared/testing',
      '@libs': 'src/core/libs',
      '@contexts': 'src/core/contexts',
      '@configs': 'src/core/configs',
      '@debug': 'src/core/debug',
      '@i18n': 'src/core/i18n',
      '@services': 'src/core/services',
      '@stores': 'src/core/state',
      '@pages': 'src/shell/pages',
    };
    
    for (const [alias, path] of Object.entries(aliasMap)) {
      if (importPath.startsWith(alias + '/') || importPath === alias) {
        const suffix = importPath.slice(alias.length);
        resolvedPath = resolve(rootDir, path, suffix);
        break;
      }
    }
  } else if (importPath.startsWith('.')) {
    resolvedPath = resolve(fromDir, importPath);
  }
  
  // Try to find the actual file with extensions
  for (const ext of EXTENSIONS) {
    const withExt = resolvedPath + ext;
    if (existsSync(withExt)) return withExt;
  }
  
  // Check for index files
  for (const ext of EXTENSIONS) {
    const indexPath = resolve(resolvedPath, 'index' + ext);
    if (existsSync(indexPath)) return indexPath;
  }
  
  return null;
}

function buildDependencyGraph(rootDir: string): DependencyGraph {
  const sourceFiles = getAllSourceFiles(rootDir);
  const graph: DependencyGraph = {
    nodes: new Map(),
    testFileMap: new Map(),
    packageMap: new Map(),
  };
  
  // First pass: create nodes
  for (const file of sourceFiles) {
    const content = readFileSync(file, 'utf-8');
    const imports = parseImports(content, file);
    const testFile = isTestFile(file);
    
    const node: DependencyNode = {
      file,
      imports: [],
      importedBy: [],
      isTest: testFile,
    };
    
    graph.nodes.set(file, node);
    
    if (testFile) {
      // Map test file to its source file (heuristic: test file next to source or in __tests__)
      const baseName = basename(file);
      const sourceName = baseName.replace(/\.(test|spec)\./, '.');
      const sourcePath = resolve(dirname(file), sourceName);
      
      if (graph.nodes.has(sourcePath)) {
        if (!graph.testFileMap.has(sourcePath)) {
          graph.testFileMap.set(sourcePath, []);
        }
        graph.testFileMap.get(sourcePath)!.push(file);
      }
    }
  }
  
  // Second pass: resolve imports
  for (const [file, node] of graph.nodes) {
    const content = readFileSync(file, 'utf-8');
    const imports = parseImports(content, file);
    
    for (const importPath of imports) {
      const resolved = resolveImportPath(importPath, file, rootDir);
      if (resolved && graph.nodes.has(resolved)) {
        node.imports.push(resolved);
        const targetNode = graph.nodes.get(resolved)!;
        if (!targetNode.importedBy.includes(file)) {
          targetNode.importedBy.push(file);
        }
      }
    }
  }
  
  // Build test file map for all source files
  for (const [file, node] of graph.nodes) {
    if (!node.isTest) {
      const testFiles: string[] = [];
      
      // Direct test files
      if (graph.testFileMap.has(file)) {
        testFiles.push(...graph.testFileMap.get(file)!);
      }
      
      // Tests in __tests__ directory
      const testsDir = resolve(dirname(file), '__tests__');
      if (existsSync(testsDir)) {
        const testFilesInDir = getAllSourceFiles(testsDir).filter(f => isTestFile(f));
        testFiles.push(...testFilesInDir);
      }
      
      // Tests with same name in same directory
      const baseName = basename(file, extname(file));
      const testPatterns = [
        `${baseName}.test.ts`,
        `${baseName}.test.tsx`,
        `${baseName}.spec.ts`,
        `${baseName}.spec.tsx`,
      ];
      
      for (const pattern of testPatterns) {
        const testFile = resolve(dirname(file), pattern);
        if (graph.nodes.has(testFile)) {
          testFiles.push(testFile);
        }
      }
      
      if (testFiles.length > 0) {
        graph.testFileMap.set(file, [...new Set(testFiles)]);
      }
    }
  }
  
  return graph;
}

function findAffectedTests(graph: DependencyGraph, changedFiles: string[]): string[] {
  const affected = new Set<string>();
  const visited = new Set<string>();
  const queue: string[] = [];
  
  // Add changed files to queue
  for (const file of changedFiles) {
    const resolved = resolve(file);
    if (graph.nodes.has(resolved)) {
      queue.push(resolved);
    }
  }
  
  // BFS to find all affected files
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (visited.has(file)) continue;
    visited.add(file);
    
    const node = graph.nodes.get(file);
    if (!node) continue;
    
    // If this is a source file, add its tests
    if (!node.isTest) {
      const tests = graph.testFileMap.get(file);
      if (tests) {
        for (const test of tests) {
          affected.add(test);
        }
      }
    }
    
    // Add files that import this file (reverse dependencies)
    for (const importer of node.importedBy) {
      if (!visited.has(importer)) {
        queue.push(importer);
      }
    }
    
    // Also follow imports forward (if a dependency changes, its dependents are affected)
    for (const imported of node.imports) {
      if (!visited.has(imported)) {
        queue.push(imported);
      }
    }
  }
  
  return Array.from(affected);
}

function getChangedFiles(since?: string): string[] {
  try {
    const args = ['diff', '--name-only', '--diff-filter=ACMRTUXB'];
    if (since) {
      args.push(since);
    } else {
      // Default to comparing with origin/main or HEAD~1
      args.push('HEAD~1');
    }
    
    // 30s timeout: a hung git (lock contention, credential prompt) must not
    // stall the CI job; on timeout status is null and we fall through to [].
    const result = spawnSync('git', args, { encoding: 'utf-8', timeout: 30_000 });
    if (result.status !== 0) {
      console.error('Git diff failed:', result.stderr);
      return [];
    }
    
    return result.stdout
      .trim()
      .split('\n')
      .filter(f => f && EXTENSIONS.includes(extname(f)));
  } catch {
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const rootDir = resolve(process.cwd());
  const srcDir = resolve(rootDir, 'src');
  
  const options = {
    since: args.find(a => a.startsWith('--since='))?.split('=')[1],
    output: args.find(a => a.startsWith('--output='))?.split('=')[1],
    json: args.includes('--json'),
    list: args.includes('--list'),
    verbose: args.includes('--verbose'),
  };
  
  console.log('Building dependency graph...');
  const graph = buildDependencyGraph(srcDir);
  console.log(`Graph built: ${graph.nodes.size} files`);
  
  const changedFiles = options.since 
    ? getChangedFiles(options.since)
    : getChangedFiles();
  
  if (changedFiles.length === 0) {
    console.log('No changed files detected');
    if (options.list) console.log('[]');
    return;
  }
  
  console.log(`Changed files (${changedFiles.length}):`);
  if (options.verbose) {
    changedFiles.forEach(f => console.log(`  ${relative(rootDir, f)}`));
  }
  
  const affectedTests = findAffectedTests(graph, changedFiles);
  
  console.log(`Affected tests (${affectedTests.length}):`);
  if (options.verbose) {
    affectedTests.forEach(f => console.log(`  ${relative(rootDir, f)}`));
  }
  
  if (options.json) {
    const output = {
      changedFiles: changedFiles.map(f => relative(rootDir, f)),
      affectedTests: affectedTests.map(f => relative(rootDir, f)),
      totalFiles: graph.nodes.size,
      timestamp: new Date().toISOString(),
    };
    
    if (options.output) {
      writeFileSync(options.output, JSON.stringify(output, null, 2));
    } else {
      console.log(JSON.stringify(output, null, 2));
    }
  } else if (options.list) {
    console.log(affectedTests.map(f => relative(rootDir, f)).join(' '));
  }
}

main().catch(console.error);