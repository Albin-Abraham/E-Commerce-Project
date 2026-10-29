/**
 * @file field-registry.ts
 * @description Registry for form structure normalization and field resolution.
 *
 * ## Purpose
 * A `FormDefinition` is a **hierarchical** JSON tree:
 * ```
 * FormDefinition
 *   └── sections[]
 *         ├── fields[]
 *         └── subSections[]
 *               └── fields[]
 * ```
 *
 * Every time the engine needs to look up a field or section, walking this tree
 * is O(n). The `FieldRegistry` flattens this structure into two flat maps
 * (`fields` and `sections`), enabling O(1) lookups by ID throughout the engine.
 *
 * Normalization happens **once at construction** — the `NormalizedForm` is
 * immutable at runtime (fields/sections are never added or removed).
 *
 * ## Normalization enrichment
 * During normalization, each field is augmented with:
 * - `sectionId` — which section it belongs to.
 * - `parentId`  — its parent field ID (for nested/repeater children).
 *
 * These are used by {@link FormVisibility} for cascading hide/show logic.
 */
import type { NormalizedForm, SectionEntity } from "@form-core/int-types";
import type {
  FormField,
  FormDefinition,
  FormSection,
  RawFormSection,
  FieldDependencyNode,
  FieldDependencyGraph,
} from "../domain";
import {
  createEmptyDependencyNode,
  mergeDependencyNodes,
  detectDependencyCycles,
} from "../domain";
import { resolveFieldIdentity } from "../utils/normalization-utils";

import { getCompositeFields } from "../composite-registry";
import { injectionRegistry } from "../injection-registry";
import { fieldTypeRegistry } from "./capability-registry";

/**
 * Thin wrapper around `NormalizedForm`.
 *
 * Constructed once per form instance. All engine modules receive a reference to the
 * same registry, ensuring they share a single, consistent view of the form structure.
 */
export class FieldRegistry {
  /** The fully normalized (flat) form definition. Read-only after construction. */
  public definition: NormalizedForm;

  /**
   * @param definition - The raw hierarchical `FormDefinition` from the schema.
   *   It is immediately normalized into a flat `NormalizedForm` via {@link normalizeFormDefinition}.
   */
  constructor(definition: FormDefinition<any>) {
    this.definition = normalizeFormDefinition(definition);
  }

  /**
   * Returns all registered fields as a flat array.
   * Useful for iterator-based operations like computed field recalculation.
   */
  public getAllFields(): FormField[] {
    return Object.values(this.definition.fields);
  }

  /**
   * Retrieves the categorized dependency node for a given field (by name or ID).
   * Returns empty Sets if the field has no dependents.
   */
  public getDependenciesForField(fieldIdentifier: string): FieldDependencyNode {
    const graph = this.definition.fieldDependencyGraph;
    if (!graph) {
      return createEmptyDependencyNode();
    }

    const field = this.definition.fields[fieldIdentifier];
    const fieldName = field?.name || fieldIdentifier;
    const fieldId = field?.id || fieldIdentifier;

    const byName = fieldName ? graph[fieldName] : undefined;
    const byId = fieldId ? graph[fieldId] : undefined;

    if (!byName && !byId) {
      return createEmptyDependencyNode();
    }
    if (byName && !byId) return byName;
    if (!byName && byId) return byId;

    return mergeDependencyNodes(byName, byId);
  }
}

// ============================================================================
//  NORMALIZATION
// ============================================================================

/**
 * Converts a hierarchical `FormDefinition` into a flat `NormalizedForm`.
 *
 * This is the most important pre-processing step in the engine. By doing this
 * once at form construction, all subsequent operations (field lookup, validation,
 * visibility evaluation) are O(1) instead of O(n).
 *
 * **What it does:**
 * - Records all fields in a flat `fields` map (indexed by field ID).
 * - Records all sections in a flat `sections` map (indexed by section ID).
 * - Captures `rootSections` as an ordered array of top-level section IDs.
 * - Injects `sectionId` and `parentId` into each field for cascading logic.
 * - Recursively handles nested fields (repeater children) and sub-sections.
 *
 * @param def - The raw hierarchical `FormDefinition` to normalize.
 * @returns   A fully flat `NormalizedForm` ready for runtime use.
 *
 * @example
 * const norm = normalizeFormDefinition({
 *   id: "my-form",
 *   sections: [{
 *     id: "personal",
 *     fields: [
 *       { id: "name", name: "name", type: "text", label: "Name" },
 *       { id: "dob",  name: "dob",  type: "date", label: "DOB" }
 *     ]
 *   }]
 * });
 *
 * norm.fields["name"];    // → { id: "name", sectionId: "personal", parentId: undefined, ... }
 * norm.sections["personal"]; // → { id: "personal", fieldIds: ["name", "dob"], ... }
 * norm.rootSections;      // → ["personal"]
 */
export function normalizeFormDefinition(def: FormDefinition<any>): NormalizedForm {
  // Start with an empty flat structure
  const norm: NormalizedForm = {
    metadata: { ...def, sections: [] } as Omit<FormDefinition, "sections"> & {
      sections: [];
    },
    sections: {}, // Populated by traverse()
    fields: {}, // Populated by registerField()
    rootSections: [],
    dependencyGraph: {},
    fieldDependencyGraph: {},
    renderTree: [],
    renderNodes: {},
  };

  /**
   * Extracts categorized dependencies for visibility, computed, validation, and remote options.
   */
  const extractCategorizedDependencies = (
    field: FormField
  ): {
    visibility: string[];
    computed: string[];
    validation: string[];
    remoteOptions: string[];
  } => {
    const visibility = new Set<string>();
    const computed = new Set<string>();
    const validation = new Set<string>();
    const remoteOptions = new Set<string>();
    const fieldRegex = /\{\{([\w.]+)\}\}/g;

    // A. Reactive expressions (visible/enabled)
    const expressions = [
      typeof field.visible !== "boolean"
        ? (field.visible as any)?.expression
        : null,
      typeof field.enabled !== "boolean"
        ? (field.enabled as any)?.expression
        : null,
    ].filter(Boolean);

    expressions.forEach((expr) => {
      let match;
      while ((match = fieldRegex.exec(expr)) !== null) {
        visibility.add(match[1]);
      }
    });

    // B. Condition schemas
    const conditionsObj = field.conditions ?? field.meta?.conditions;
    if (conditionsObj) {
      if (conditionsObj.groups) {
        conditionsObj.groups.forEach((group: any) => {
          group.rules?.forEach((rule: any) => {
            if (rule.field) visibility.add(rule.field);
          });
        });
      }
      if ((conditionsObj as any).if) {
        (conditionsObj as any).if.forEach((rule: any) => {
          if (rule.field) visibility.add(rule.field);
        });
      }
    }

    // General fallback dependsOn
    if (Array.isArray((field as any).dependsOn)) {
      (field as any).dependsOn.forEach((d: string) => visibility.add(d));
    }

    // C. Computed fields
    const comp = (field as any).computed;
    if (comp) {
      if (comp.formula) {
        let match;
        while ((match = fieldRegex.exec(comp.formula)) !== null) {
          computed.add(match[1]);
        }
      }
      if (Array.isArray(comp.dependsOn)) {
        comp.dependsOn.forEach((d: string) => computed.add(d));
      }
    }

    // D. Validation dependencies (Cross-field validation)
    if (field.validation) {
      if (Array.isArray(field.validation.dependsOn)) {
        field.validation.dependsOn.forEach((d) => validation.add(d));
      }
      if (Array.isArray(field.validation.rules)) {
        field.validation.rules.forEach((rule: any) => {
          if (rule.type === "match" || rule.type === "matches") {
            const targetField =
              rule.field ||
              (typeof rule.value === "string" ? rule.value : null);
            if (
              targetField &&
              targetField !== field.name &&
              targetField !== field.id
            ) {
              validation.add(targetField);
            }
          }
        });
      }
      if (Array.isArray(field.validation.crossField)) {
        field.validation.crossField.forEach((cf: any) => {
          if (Array.isArray(cf.fields)) {
            cf.fields.forEach((f: string) => {
              if (f !== field.name && f !== field.id) {
                validation.add(f);
              }
            });
          }
        });
      }
    }

    // E. Remote Options Watch
    if (field.remoteOptions?.watch) {
      field.remoteOptions.watch.forEach((w: string) => remoteOptions.add(w));
    }

    return {
      visibility: Array.from(visibility),
      computed: Array.from(computed),
      validation: Array.from(validation),
      remoteOptions: Array.from(remoteOptions),
    };
  };

  /**
   * Legacy helper retaining string[] output for any custom caller.
   */
  const extractDependencies = (field: FormField): string[] => {
    const deps = extractCategorizedDependencies(field);
    return Array.from(
      new Set([
        ...deps.visibility,
        ...deps.computed,
        ...deps.validation,
        ...deps.remoteOptions,
      ])
    );
  };

  /**
   * Detects circular dependencies in the dependency graph using DFS.
   */
  const detectCycle = (graph: Record<string, string[]>): string[] | null => {
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (node: string): string[] | null => {
      if (stack.has(node)) return [node];
      if (visited.has(node)) return null;

      visited.add(node);
      stack.add(node);

      for (const dep of graph[node] ?? []) {
        const cycle = dfs(dep);
        if (cycle) return [node, ...cycle];
      }

      stack.delete(node);
      return null;
    };

    for (const node of Object.keys(graph)) {
      const cycle = dfs(node);
      if (cycle) return cycle;
    }

    return null;
  };

  let idCounter = 0;

  /**
   * Recursively registers a field (and its nested children) into `norm.fields`.
   * Also handles 'slot' expansion from the InjectionRegistry.
   */
  const registerField = (
    field: any,
    sectionId: string,
    parentId?: string,
    isTemplate = false,
    depth = 0
  ): import("@form-core/int-types").RenderNode[] => {
    // ── SLOT EXPANSION ───────────────────────────────────────────────────
    if (field.type === "slot" && field.name) {
      const fragment = injectionRegistry.get(field.name, def.metadata);
      if (fragment) {
        return fragment.flatMap((f: any) =>
          registerField(f, sectionId, parentId, isTemplate, depth)
        );
      } else {
        console.warn(
          `[FieldRegistry] Injection Slot "${field.name}" not found in registry.`
        );
        return [];
      }
    }

    const { id: fieldId, name: fieldName } = resolveFieldIdentity(
      field,
      `register:${field.type || "unknown"}`,
      { value: idCounter }
    );
    field.id = fieldId;
    field.name = fieldName;

    // ── ECS Composite Expansion ──
    const compositeTemplates = getCompositeFields(field.type);
    if (compositeTemplates && (!field.fields || field.fields.length === 0)) {
      field.fields = compositeTemplates.map((template: any) => {
        const childName = template.name;
        const childId = template.id || childName;
        return {
          ...template,
          id: `${fieldId}-${childId}`,
          name:
            field.name && childName
              ? `${field.name}.${childName}`
              : childName || childId,
          properties: {
            ...field.properties,
            ...template.properties,
          },
        } as FormField;
      });
      if (field.type !== "repeater") {
        field.isExpandedComposite = true;
      }
    }

    // Ensure virtual section exists for orphaned fields
    if (sectionId === "root-section" && !norm.sections["root-section"]) {
      norm.sections["root-section"] = {
        id: "root-section",
        title: "Root",
        fieldIds: [],
        subSectionIds: [],
        parentId: undefined,
      } as any;
      norm.rootSections.push("root-section");
    }

    // --- INJECTION MERGE (Global-to-Local Stitching) ---
    const injections = def.injections || {};

    const validationInjection =
      (fieldName && injections.validations?.[fieldName]) ||
      injections.validations?.[fieldId];
    const uiInjection =
      (fieldName && injections.ui?.[fieldName]) || injections.ui?.[fieldId];
    const conditionInjection =
      (fieldName && injections.conditions?.[fieldName]) ||
      injections.conditions?.[fieldId];

    // Conflict detection for injections
    if (process.env.NODE_ENV === "development") {
      if (
        fieldName &&
        injections.validations?.[fieldName] &&
        injections.validations?.[fieldId] &&
        fieldName !== fieldId
      ) {
        console.warn(
          `[FieldRegistry] Injection conflict: field "${fieldName}" (id: ${fieldId}) has multiple validation injections.`
        );
      }
    }

    const mergedField: any = {
      ...field,
      validation: validationInjection
        ? { ...field.validation, ...validationInjection }
        : field.validation,
      properties: uiInjection
        ? { ...field.properties, ...uiInjection }
        : field.properties,
      conditions: conditionInjection || field.conditions,
      sectionId,
      parentId,
      isTemplate,
      repeaterConfig: (field as any).repeaterConfig,
      capabilities: (() => {
        try {
          return fieldTypeRegistry.getCapabilities(field.type);
        } catch {
          console.warn(
            `[FieldRegistry] Unknown field type "${field.type}". Capabilities defaulted to INPUT.`
          );
          return fieldTypeRegistry.getCapabilities("text");
        }
      })(),
    };

    // Store enriched field in the flat map
    norm.fields[fieldId] = mergedField;

    const node: import("@form-core/int-types").RenderNode = {
      stateKey: fieldId,
      dataPath: field.name || fieldId,
      id: fieldId,
      fieldType: field.type,
      category: (() => {
        try {
          return fieldTypeRegistry.get(field.type).category;
        } catch {
          return "input" as const;
        }
      })(),
      capabilities: mergedField.capabilities,
      depth,
      parentId: parentId || null,
      children: [],
      rowGroup: null,
      visibilityKey: fieldId,
    };

    // Store in flat node map for resolution
    norm.renderNodes[fieldId] = node;

    // Track field in section
    if (norm.sections[sectionId]) {
      norm.sections[sectionId].fieldIds.push(fieldId);
    }

    // Build categorized dependency graph & legacy graph
    const catDeps = extractCategorizedDependencies(mergedField);

    const registerDep = (
      sourceName: string,
      category: keyof FieldDependencyNode
    ) => {
      if (!norm.fieldDependencyGraph[sourceName]) {
        norm.fieldDependencyGraph[sourceName] = createEmptyDependencyNode();
      }
      norm.fieldDependencyGraph[sourceName][category].add(fieldId);

      // Legacy graph (for backward compatibility)
      if (!norm.dependencyGraph[sourceName]) {
        norm.dependencyGraph[sourceName] = [];
      }
      if (!norm.dependencyGraph[sourceName].includes(fieldId)) {
        norm.dependencyGraph[sourceName].push(fieldId);
      }
    };

    catDeps.visibility.forEach((dep) => registerDep(dep, "visibility"));
    catDeps.computed.forEach((dep) => registerDep(dep, "computed"));
    catDeps.validation.forEach((dep) => registerDep(dep, "validation"));
    catDeps.remoteOptions.forEach((dep) => registerDep(dep, "remoteOptions"));

    // Recursively register nested children (e.g., fields inside a repeater/group)
    if (field.fields) {
      // Children of a repeater are always templates, regardless of nesting depth
      const childIsTemplate = isTemplate || field.type === "repeater";
      node.children = field.fields.flatMap((child: any) =>
        registerField(child, sectionId, fieldId, childIsTemplate, depth + 1)
      );
    }

    return [node];
  };

  /**
   * Recursively traverses sections (and sub-sections), building `norm.sections`.
   */
  const traverse = (
    sections?: RawFormSection[],
    parentId?: string
  ): string[] => {
    if (!Array.isArray(sections)) return [];
    return sections.map((section) => {
      if (section.key && !section.id) {
        section.id = section.key;
      }
      const sectionId = section.id || `section_${++idCounter}`;

      // Build a SectionEntity: strip nested arrays, replace with ID lists
      const sectionEntity: SectionEntity = {
        ...section,
        id: sectionId,
        fields: undefined, // Remove raw field array — use fieldIds instead
        subSections: undefined, // Remove raw sub-section array — use subSectionIds instead
        fieldIds: [],
        subSectionIds: [],
        parentId,
      } as unknown as SectionEntity;

      // Add to flat sections map BEFORE registering fields
      // This ensures registerField can push to sectionEntity.fieldIds
      norm.sections[sectionId] = sectionEntity;

      // Register all direct fields of this section
      if (section.fields) {
        const nodes = section.fields.flatMap((f) =>
          registerField(f, sectionId)
        );
        if (!parentId) {
          norm.renderTree.push(...nodes);
        }
      }

      // Recursively traverse sub-sections
      if (section.subSections) {
        sectionEntity.subSectionIds = traverse(section.subSections, sectionId);
      }

      return sectionId;
    });
  };

  /**
   * Scans structural containers (Split/Hero) for inline field definitions.
   */
  const traverseContainers = (containers?: any[]) => {
    if (!containers) return;
    containers.forEach((container) => {
      const config = container.config || {};
      // Handle Split Layout Panes
      [config.leftContent, config.rightContent].forEach((pane) => {
        if (pane?.type === "container" && pane.fields) {
          pane.fields.forEach((field: FormField) => {
            registerField(field, "root-section");
          });
        }
      });
      // Handle Generic Container Fields
      if (container.fields) {
        container.fields.forEach((field: FormField) => {
          registerField(field, "root-section");
        });
      }
    });
  };

  // 1. Register Root-Level Fields (Orphans)
  if (def.fields && Array.isArray(def.fields)) {
    const nodes = def.fields.flatMap((field) =>
      registerField(field, "root-section")
    );
    norm.renderTree.push(...nodes);
  }

  // 2. Traverse Containers (Layout-driven fields)
  traverseContainers(def.containers);

  // 3. Traverse standard sections
  norm.rootSections = traverse(def.sections);

  // 4. Layout Orchestration (Simple Row-Group Assignment)
  let currentRow = 0;
  const assignRows = (
    nodes: import("@form-core/int-types").RenderNode[]
  ) => {
    nodes.forEach((node) => {
      if (node.category === "structure" || node.category === "repeater") {
        currentRow++;
        node.rowGroup = currentRow;
        assignRows(node.children);
        currentRow++;
      } else {
        node.rowGroup = currentRow;
      }
    });
  };

  assignRows(norm.renderTree);

  // 5. Final Correctness Check: Cycle Detection
  const cycle =
    detectDependencyCycles(norm.fieldDependencyGraph, [
      "computed",
      "visibility",
    ]) || detectCycle(norm.dependencyGraph);
  if (cycle) {
    const cycleStr = cycle.join(" → ");
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[FieldRegistry] 🚨 Circular dependency detected in form schema: ${cycleStr}`
      );
    } else {
      throw new Error(`Circular dependency detected: ${cycleStr}`);
    }
  }

  return norm;
}

// ============================================================================
//  DENORMALIZATION
// ============================================================================

/**
 * Reconstructs a hierarchical `FormDefinition` from a `NormalizedForm`.
 *
 * This is the inverse of {@link normalizeFormDefinition}. Useful for:
 * - Serializing the form definition back to JSON (e.g., for persistence).
 * - Debugging — inspecting the current structural state of a normalized form.
 * - Round-trip testing: `denormalize(normalize(def))` should equal `def`.
 *
 * @param norm - The normalized form to reconstruct.
 * @returns    The hierarchical `FormDefinition`.
 * @throws     If a section or field ID referenced in the maps does not exist.
 *
 * @example
 * const original = { id: "my-form", sections: [{ id: "s1", fields: [{ id: "f1", ... }] }] };
 * const norm = normalizeFormDefinition(original);
 * const rebuilt = denormalizeForm(norm);
 * // rebuilt.sections[0].fields[0].id === "f1" ✓
 */
export function denormalizeForm(norm: NormalizedForm): FormDefinition {
  /**
   * Recursively rebuilds a `FormSection` from a `SectionEntity` ID.
   *
   * @param id - The section ID to look up in `norm.sections`.
   * @returns The reconstructed hierarchical `FormSection`.
   */
  const buildSection = (id: string): FormSection => {
    const entity = norm.sections[id];
    if (!entity)
      throw new Error(
        `[denormalizeForm] Section "${id}" not found in normalized form.`
      );

    return {
      ...entity,
      // Restore fields array from fieldIds
      fields: entity.fieldIds.map((fid) => norm.fields[fid]).filter(Boolean),
      // Recursively restore sub-sections
      subSections: entity.subSectionIds.map((sid) => buildSection(sid)),
      // Clean up flat-specific properties that don't belong on FormSection
      fieldIds: undefined as any,
      subSectionIds: undefined as any,
      parentId: undefined as any,
    } as FormSection;
  };

  return {
    ...norm.metadata,
    sections: norm.rootSections.map((id) => buildSection(id)),
  } as FormDefinition;
}
