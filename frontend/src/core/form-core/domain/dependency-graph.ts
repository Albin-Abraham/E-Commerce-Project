/**
 * @file dependency-graph.ts
 * @description Domain entity and algorithms for reactive field dependency tracking.
 *
 * ## Responsibility
 * The `FieldDependencyGraph` represents the directed acyclic graph (DAG) of reactive
 * relationships between form fields. It categorizes dependencies into four distinct dimensions:
 * 1. `visibility`: Fields whose show/hide state depends on the source field.
 * 2. `computed`: Fields whose calculated/derived value depends on the source field.
 * 3. `validation`: Fields that must re-validate when the source field changes (cross-field rules).
 * 4. `remoteOptions`: Fields that must reload dynamic options when the source field changes.
 *
 * ## Performance Contract
 * Normalization constructs this graph once in O(N).
 * At runtime, `setValue` queries the graph in O(1) to perform targeted O(D) updates,
 * where D is the number of dependent fields (D << N), completely eliminating full-form sweeps.
 */

/**
 * Categorized dependencies triggered by mutations to a single source field.
 */
export interface FieldDependencyNode {
  /** Field IDs whose visibility/enabled conditions depend on this field. */
  visibility: Set<string>;
  /** Field IDs whose computed values depend on this field. */
  computed: Set<string>;
  /** Field IDs whose validation rules depend on this field. */
  validation: Set<string>;
  /** Field IDs whose dynamic options must reload when this field changes. */
  remoteOptions: Set<string>;
}

/**
 * A normalized, multi-target dependency graph indexed by source field name or ID.
 */
export type FieldDependencyGraph = Record<string, FieldDependencyNode>;

/**
 * Creates an empty `FieldDependencyNode` with allocated Sets for each category.
 */
export function createEmptyDependencyNode(): FieldDependencyNode {
  return {
    visibility: new Set<string>(),
    computed: new Set<string>(),
    validation: new Set<string>(),
    remoteOptions: new Set<string>(),
  };
}

/**
 * Merges two dependency nodes into a single consolidated node.
 */
export function mergeDependencyNodes(
  a?: FieldDependencyNode,
  b?: FieldDependencyNode
): FieldDependencyNode {
  const merged = createEmptyDependencyNode();
  if (a) {
    a.visibility.forEach((id) => merged.visibility.add(id));
    a.computed.forEach((id) => merged.computed.add(id));
    a.validation.forEach((id) => merged.validation.add(id));
    a.remoteOptions.forEach((id) => merged.remoteOptions.add(id));
  }
  if (b) {
    b.visibility.forEach((id) => merged.visibility.add(id));
    b.computed.forEach((id) => merged.computed.add(id));
    b.validation.forEach((id) => merged.validation.add(id));
    b.remoteOptions.forEach((id) => merged.remoteOptions.add(id));
  }
  return merged;
}

/**
 * Detects circular dependencies within the dependency graph using Depth-First Search (DFS).
 *
 * @param graph - The multi-target dependency graph.
 * @param categories - Optional subset of dependency categories to check (default: `['computed', 'visibility']`).
 * @returns An array representing the cycle path (e.g., `['a', 'b', 'a']`), or `null` if acyclic.
 */
export function detectDependencyCycles(
  graph: FieldDependencyGraph,
  categories: Array<keyof FieldDependencyNode> = ["computed", "visibility"]
): string[] | null {
  const visited = new Set<string>();
  const inStack = new Set<string>();

  // Build a consolidated adjacency set for the selected categories
  const adjacency = new Map<string, Set<string>>();
  for (const [source, node] of Object.entries(graph)) {
    const targets = new Set<string>();
    for (const cat of categories) {
      node[cat]?.forEach((target) => targets.add(target));
    }
    adjacency.set(source, targets);
  }

  const dfs = (node: string): string[] | null => {
    if (inStack.has(node)) {
      return [node];
    }
    if (visited.has(node)) {
      return null;
    }

    visited.add(node);
    inStack.add(node);

    const neighbors = adjacency.get(node);
    if (neighbors) {
      for (const neighbor of neighbors) {
        const cycle = dfs(neighbor);
        if (cycle) {
          return [node, ...cycle];
        }
      }
    }

    inStack.delete(node);
    return null;
  };

  for (const node of adjacency.keys()) {
    const cycle = dfs(node);
    if (cycle) {
      return cycle;
    }
  }

  return null;
}
