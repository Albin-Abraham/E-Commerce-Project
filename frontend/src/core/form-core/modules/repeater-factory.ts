import type { RenderNode } from "../int-types";
import type { RepeaterConfig, RowPathFormat } from "../domain";
import { StateManager } from "./state-manager";

/**
 * Handles the materialization and destruction of dynamic Repeater rows.
 * Part of the Layer 3 (Render Output) logic of the Zenith Render Engine.
 *
 * It ensures that every dynamic field instance in a repeater receives
 * its own unique state slices (V1-V5) and clean namespaced IDs.
 */
export class RepeaterRowFactory<
  T extends Record<string, any> = Record<string, any>,
> {
  private rowIdMap = new WeakMap<object, string>();
  private rowCounter = 0;

  constructor(private stateManager: StateManager<T>) {}

  /**
   * Resolves or assigns a stable, immutable identifier for a row entity.
   * If the row data does not have an ID field, generates an immutable UUID,
   * stores it in a WeakMap, and sets it as a non-enumerable property.
   */
  public getOrAssignRowId(rowData: any, idField = "id"): string {
    if (rowData && typeof rowData === "object") {
      if (
        rowData[idField] !== undefined &&
        rowData[idField] !== null &&
        rowData[idField] !== ""
      ) {
        return String(rowData[idField]);
      }
      if (rowData._rowId) return String(rowData._rowId);
      if (this.rowIdMap.has(rowData)) return this.rowIdMap.get(rowData)!;

      const generatedId = `row_${++this.rowCounter}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      this.rowIdMap.set(rowData, generatedId);
      try {
        Object.defineProperty(rowData, "_rowId", {
          value: generatedId,
          writable: true,
          enumerable: false, // Excluded from JSON.stringify payloads!
          configurable: true,
        });
      } catch {
        // Safe fallback if object is sealed/frozen
      }
      return generatedId;
    }
    return `row_${++this.rowCounter}`;
  }

  /**
   * Resolves the internal state key for a field in a repeater row.
   * This key is used for V2-V5 state slices and must be stable across reordering.
   */
  public resolveStateKey(
    repeaterId: string,
    rowIndex: number,
    rowData: any,
    config: RepeaterConfig | undefined,
    leafName: string
  ): string {
    // Identity-based strategy is the 10/10 default to guarantee reordering safety
    const isIdentityStrategy =
      config?.rowStateStrategy === "identity" ||
      config?.rowStateStrategy === undefined;

    if (isIdentityStrategy && rowData) {
      const idField = config?.rowIdentityField || "id";
      const rowId = this.getOrAssignRowId(rowData, idField);
      return `${repeaterId}__${rowId}__${leafName}`;
    }

    // Positional fallback if explicitly requested (rowStateStrategy === "index")
    return `${repeaterId}[${rowIndex}].${leafName}`;
  }

  /**
   * Resolves the external data path for a field in a repeater row.
   * This path is used for V1 (Value) access and final serialization.
   */
  private resolveDataPath(
    repeaterId: string,
    rowIndex: number,
    rowData: any,
    format: RowPathFormat | undefined,
    leafName: string
  ): string {
    if (!format) {
      // Default: Standard lodash-compatible array notation.
      return `${repeaterId}[${rowIndex}].${leafName}`;
    }

    const idField = format.identityField || "id";
    const rowId = rowData?.[idField] ?? rowIndex;

    // Use replaceAll to ensure all tokens in the template are replaced.
    const namespacedPart = format.template
      .replaceAll("[idx]", String(rowIndex))
      .replaceAll("[id]", String(rowId));

    return `${repeaterId}${namespacedPart}${leafName}`;
  }

  /**
   * Clones a template of RenderNodes into a specific row instance.
   *
   * @param repeaterId - The full positional path of the parent repeater (e.g., "users").
   * @param rowIndex - The 0-indexed position of the row.
   * @param template - The array of child RenderNodes.
   * @param rowData - The actual data for this row.
   * @returns An array of namespaced RenderNodes.
   */
  public createRowNodes(
    repeaterId: string,
    rowIndex: number,
    template: RenderNode[],
    rowData?: any
  ): RenderNode[] {
    const repeater = this.stateManager.resolver?.resolveField(repeaterId);
    const config = (repeater as any)?.repeaterConfig;

    return template.map((node) => {
      // Extract the leaf name from the template node
      const leafName = node.stateKey.split(".").pop() || node.stateKey;

      // 1. Resolve internal state key (V2-V5)
      const stateKey = this.resolveStateKey(
        repeaterId,
        rowIndex,
        rowData,
        config,
        leafName
      );

      // 2. Resolve external data path (V1)
      const dataPath = this.resolveDataPath(
        repeaterId,
        rowIndex,
        rowData,
        config?.rowPathFormat,
        leafName
      );

      const rowNode: RenderNode = {
        ...node,
        stateKey,
        dataPath,
        id: stateKey, // Legacy compatibility
        parentId: repeaterId,
        visibilityKey: stateKey,
        children: node.children,
      };

      // Register state slices using the stable stateKey.
      this.stateManager.registerRowState(stateKey);

      return rowNode;
    });
  }

  /**
   * Cleans up state slices for a deleted row to prevent memory leaks and "ghost" validation errors.
   *
   * @param repeaterId - The parent repeater ID.
   * @param rowIndex - The index of the row being removed.
   * @param template - The child templates to clean up.
   */
  public destroyRow(
    repeaterId: string,
    rowIndex: number,
    template: RenderNode[],
    rowData?: any
  ) {
    const repeater = this.stateManager.resolver?.resolveField(repeaterId);
    const config = (repeater as any)?.repeaterConfig;

    template.forEach((node) => {
      const leafName = node.stateKey.split(".").pop() || node.stateKey;
      const stateKey = this.resolveStateKey(
        repeaterId,
        rowIndex,
        rowData,
        config,
        leafName
      );
      this.stateManager.deregisterRowState(stateKey);
    });
  }
}
