import type { FieldResolver } from "@form-core/modules/resolver";
import type { FormRuntime } from "@form-core/modules/runtime";
import type { StateManager } from "@form-core/modules/state-manager";
import type { RemoteOptions } from "../domain";
import { ExpressionEvaluator } from "../utils/expression-evaluator";
import debounce from "lodash-es/debounce";

import { ResponseFactory } from "@core/http";

import { DebugManager } from "./debug-manager";

/**
 * RemoteOptionsManager
 * Handles fetching dynamic options for fields based on their remoteOptions configuration.
 *
 * Features:
 * - Debounced re-fetching when watched fields change (configurable per field)
 * - Deduplication via dependency key hashing
 * - Performance metrics tracking
 * - Debug logging integration
 */
export class RemoteOptionsManager<T extends Record<string, any>> {
  private lastFetchKeys = new Map<string, string>();
  private debounceTimers = new Map<string, ReturnType<typeof debounce>>();
  private searchDebounceTimers = new Map<string, ReturnType<typeof debounce>>();
  private pendingFetches = new Map<string, Promise<void>>();
  /** Monotonically increasing epoch sequence number per field for race condition protection. */
  private fieldEpochs = new Map<string, number>();
  /** Active AbortController instances per field for in-flight request cancellation. */
  private abortControllers = new Map<string, AbortController>();

  constructor(
    private stateManager: StateManager<T>,
    private resolver: FieldResolver,
    private runtime: FormRuntime<T>,
    private debugManager?: DebugManager<T>
  ) {}

  /**
   * Scans all fields and triggers initial fetches for those with no dependencies or whose dependencies are met.
   */
  async initialize() {
    const fields = this.resolver.registry.getAllFields();
    const promises = fields
      .filter((f) => f.remoteOptions)
      .map((f) => this.fetchOptions(f.id));
    await Promise.all(promises);
  }

  /**
   * Checks if any fields depend on the changed field and triggers their fetches.
   * Respects per-field debounce configuration from `remoteOptions.debounceMs`.
   *
   * @param changedFieldId - The field that changed.
   * @param dependentFieldIds - Optional pre-computed dependent field IDs from FieldDependencyGraph for O(D) performance.
   */
  handleValueChange(
    changedFieldId: string,
    dependentFieldIds?: Iterable<string>
  ) {
    const changedField = this.resolver.resolveField(changedFieldId);
    if (!changedField?.name) return;

    let targetIds: string[] = [];

    if (dependentFieldIds) {
      targetIds = Array.from(dependentFieldIds);
    } else {
      const graphDeps =
        this.resolver.registry.getDependenciesForField(changedFieldId);
      if (graphDeps?.remoteOptions && graphDeps.remoteOptions.size > 0) {
        targetIds = Array.from(graphDeps.remoteOptions);
      } else {
        const fields = this.resolver.registry.getAllFields();
        targetIds = fields
          .filter((f) => f.remoteOptions?.watch?.includes(changedField.name!))
          .map((f) => f.id);
      }
    }

    for (const fieldId of targetIds) {
      const field = this.resolver.resolveField(fieldId);
      if (!field?.remoteOptions) continue;

      const debounceMs = field.remoteOptions?.debounceMs ?? 300;

      // Get or create a debounced version of fetchOptions for this field
      let debouncedFetch = this.debounceTimers.get(field.id);
      if (!debouncedFetch) {
        debouncedFetch = debounce(
          (id: string) => this.fetchOptions(id),
          debounceMs,
          { leading: false, trailing: true, maxWait: debounceMs * 3 }
        );
        this.debounceTimers.set(field.id, debouncedFetch);
      }

      debouncedFetch(field.id);
    }
  }

  /**
   * Performs the actual options fetch and updates the view state.
   * Cancels any active in-flight request for this field via AbortController
   * and increments the transaction epoch to guarantee stale responses are dropped.
   */
  private async fetchOptions(fieldId: string, searchQuery?: string) {
    const field = this.resolver.resolveField(fieldId);
    if (!field?.remoteOptions) return;

    const { remoteOptions } = field;
    const values = this.stateManager.state.values;

    // 1. Check if all watched dependencies have values
    const allDepsMet =
      remoteOptions.watch?.every((path) => {
        const val = this.runtime.valueProxy.getValue(values, path);
        return val !== undefined && val !== null && val !== "";
      }) ?? true;

    if (!allDepsMet) {
      // Cancel any active fetch and clear options
      this.cancelPending(fieldId);
      this.updateViewState(fieldId, { options: [], isLoading: false });
      return;
    }

    // 2. Generate dependency key to avoid redundant fetches
    const watchValues = remoteOptions.watch?.map((path) =>
      this.runtime.valueProxy.getValue(values, path)
    );
    const serializedWatch = (watchValues ?? [])
      .map((v) => (v === null || v === undefined ? "" : String(v)))
      .join(",");
    const dependencyKey = `search:${searchQuery || ""}#watch:${serializedWatch}`;

    // Skip if we've already fetched EXACTLY this combination of dependencies + search
    if (
      this.lastFetchKeys.has(fieldId) &&
      this.lastFetchKeys.get(fieldId) === dependencyKey
    ) {
      return;
    }

    // 3. Abort prior in-flight request for this field
    const previousController = this.abortControllers.get(fieldId);
    if (previousController) {
      previousController.abort();
      this.abortControllers.delete(fieldId);
    }

    // 4. Increment transaction epoch for this field
    const epoch = (this.fieldEpochs.get(fieldId) || 0) + 1;
    this.fieldEpochs.set(fieldId, epoch);

    const controller = new AbortController();
    this.abortControllers.set(fieldId, controller);

    // 5. Start Fetch
    const startTime = performance.now();
    this.updateViewState(fieldId, { isLoading: true });
    this.lastFetchKeys.set(fieldId, dependencyKey);

    const fetchPromise = this.executeFetch(
      fieldId,
      remoteOptions,
      values,
      startTime,
      epoch,
      controller.signal,
      searchQuery
    );
    this.pendingFetches.set(fieldId, fetchPromise);

    try {
      await fetchPromise;
    } finally {
      if (this.pendingFetches.get(fieldId) === fetchPromise) {
        this.pendingFetches.delete(fieldId);
      }
    }
  }

  /**
   * Executes the actual HTTP fetch and maps the response to options.
   */
  private async executeFetch(
    fieldId: string,
    remoteOptions: RemoteOptions,
    values: any,
    startTime: number,
    epoch: number,
    signal: AbortSignal,
    searchQuery?: string
  ): Promise<void> {
    let url = "";
    try {
      url = ExpressionEvaluator.interpolate(remoteOptions.url, values);
      if (remoteOptions.params || searchQuery) {
        const mergedParams = { ...(remoteOptions.params || {}) };
        if (searchQuery) {
          mergedParams["search"] = searchQuery;
        }

        const query = Object.entries(mergedParams)
          .map(([key, value]) => {
            const resolved =
              typeof value === "string"
                ? ExpressionEvaluator.interpolate(value, values)
                : value;
            return `${key}=${encodeURIComponent(String(resolved))}`;
          })
          .join("&");
        url += (url.includes("?") ? "&" : "?") + query;
      }

      const { httpClient } = await import("@services/http.instance");
      console.log(`[RemoteOptions:${fieldId}] FETCH -> ${url}`);
      const response = await httpClient.auth.request({
        url,
        method: remoteOptions.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(remoteOptions.headers || {}),
        },
        signal,
      });

      // Stale Response Gate: If a newer request was dispatched for this field, discard response!
      if (this.fieldEpochs.get(fieldId) !== epoch || signal.aborted) {
        console.log(
          `[RemoteOptions:${fieldId}] STALE DROPPED -> epoch=${epoch} current=${this.fieldEpochs.get(fieldId)}`
        );
        return;
      }

      // 4. Map and Filter using centralized HTTP ResponseFactory.UnWrap
      const unwrapped = ResponseFactory.UnWrap<any, any>(response, {
        casing: "none",
        autoEnvelope: true,
      });

      const rawOptions = Array.isArray(unwrapped)
        ? unwrapped
        : Array.isArray(unwrapped?.options)
        ? unwrapped.options
        : [];

      const mapping = remoteOptions.mapping;
      const options = rawOptions.map((item: any) => ({
        label: mapping?.labelPath
          ? item[mapping.labelPath]
          : item.name || item.label || String(item),
        value: mapping?.valuePath
          ? item[mapping.valuePath]
          : item.iso2 || item.id || item.value || item.name || String(item),
        description: mapping?.descriptionPath
          ? item[mapping.descriptionPath]
          : undefined,
        icon: mapping?.iconPath ? item[mapping.iconPath] : undefined,
        meta: item,
      }));

      // Small delay for test environment stability (settling React state)
      if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Check epoch again after async delay
      if (this.fieldEpochs.get(fieldId) !== epoch || signal.aborted) {
        return;
      }

      const duration = performance.now() - startTime;
      this.stateManager.setPerformance({
        lastOptionsFetchDurationMs: duration,
      });

      if (this.debugManager) {
        this.debugManager.log("remoteOptionsFetch", {
          fieldId,
          url,
          status: response.status,
          optionsCount: options.length,
          durationMs: duration,
          timestamp: Date.now(),
        });
      }

      this.updateViewState(fieldId, { options, isLoading: false });
    } catch (error: any) {
      if (
        signal.aborted ||
        error?.name === "AbortError" ||
        error?.code === "ERR_CANCELED"
      ) {
        // Expected cancellation: do not treat as error or set error view state
        return;
      }
      if (this.fieldEpochs.get(fieldId) !== epoch) {
        return;
      }

      console.error(`[RemoteOptionsManager] Failed for ${fieldId}:`, error);
      const duration = performance.now() - startTime;
      this.stateManager.setPerformance({
        lastOptionsFetchDurationMs: duration,
      });

      if (this.debugManager) {
        this.debugManager.log("remoteOptionsFetchError", {
          fieldId,
          error: error instanceof Error ? error.message : String(error),
          durationMs: duration,
          timestamp: Date.now(),
        });
      }

      this.updateViewState(fieldId, { options: [], isLoading: false });
    }
  }

  /**
   * Triggers a remote options search for a specific field.
   * Useful for autocomplete onInputChange events.
   */
  public executeSearch(fieldId: string, query: string) {
    const field = this.resolver.resolveField(fieldId);
    if (!field?.remoteOptions) return;

    const debounceMs = field.remoteOptions?.debounceMs ?? 300;

    let debouncedSearch = this.searchDebounceTimers.get(fieldId);
    if (!debouncedSearch) {
      debouncedSearch = debounce(
        (id: string, q: string) => {
          this.fetchOptions(id, q);
        },
        debounceMs,
        { leading: false, trailing: true, maxWait: debounceMs * 3 }
      );
      this.searchDebounceTimers.set(fieldId, debouncedSearch);
    }

    debouncedSearch(fieldId, query);
  }

  /**
   * Immediately aborts any in-flight fetch and cancels pending debounces for a field.
   */
  public cancelPending(fieldId: string) {
    const controller = this.abortControllers.get(fieldId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(fieldId);
    }
    this.fieldEpochs.set(fieldId, (this.fieldEpochs.get(fieldId) || 0) + 1);

    const debounced = this.debounceTimers.get(fieldId);
    if (debounced) debounced.cancel();

    const searchDebounced = this.searchDebounceTimers.get(fieldId);
    if (searchDebounced) searchDebounced.cancel();

    this.pendingFetches.delete(fieldId);
  }

  /**
   * Cancels all pending debounced fetches and in-flight requests.
   * Call on form unmount or engine disposal.
   */
  dispose() {
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
    this.fieldEpochs.clear();

    for (const timer of this.debounceTimers.values()) {
      timer.cancel();
    }
    for (const timer of this.searchDebounceTimers.values()) {
      timer.cancel();
    }
    this.searchDebounceTimers.clear();
    this.debounceTimers.clear();
    this.pendingFetches.clear();
    this.lastFetchKeys.clear();
  }

  private updateViewState(fieldId: string, patch: Partial<any>) {
    const currentView = this.stateManager.state.view[fieldId] || {};
    this.stateManager.state.view[fieldId] = { ...currentView, ...patch };
    if (typeof this.stateManager.notifyField === "function") {
      this.stateManager.notifyField(fieldId);
    }
    this.stateManager.notify();
  }
}
