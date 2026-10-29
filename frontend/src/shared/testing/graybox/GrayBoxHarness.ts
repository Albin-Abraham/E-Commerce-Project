import React from "react";
import type { RenderResult } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";
import { storeRegistry } from "@core/state/StoreRegistry";
import { queryClient } from "@core/providers/queryClient";
import { useScopeStore } from "@core/scope/scope.store";
import type { BranchScope, OrgScope } from "@core/scope/scope.types";

export interface GrayBoxHarnessOptions {
  scope?: {
    org?: OrgScope;
    branch?: BranchScope;
  };
}

export class GrayBoxHarness {
  public readonly renderResult: RenderResult;

  constructor(renderResult: RenderResult) {
    this.renderResult = renderResult;
  }

  public get container(): HTMLElement {
    return this.renderResult.container;
  }

  /**
   * Set tenancy scope in GrayBox environment.
   */
  public withScope(scope: { org?: OrgScope; branch?: BranchScope }): this {
    if (scope.org) useScopeStore.getState().selectOrg(scope.org);
    if (scope.branch) useScopeStore.getState().selectBranch(scope.branch);
    return this;
  }

  /**
   * Whitebox: Inspect store state by registered name.
   */
  public getStoreState<T = Record<string, any>>(storeName: string): T | undefined {
    const snapshot = storeRegistry.getSnapshot();
    return snapshot[storeName] as T;
  }

  /**
   * Whitebox: Inspect React Query cache data.
   */
  public getQueryCacheData<T = unknown>(queryKey: readonly unknown[]): T | undefined {
    return queryClient.getQueryData<T>(queryKey);
  }

  /**
   * Reset all state and caches between test steps.
   */
  public resetAllState(): void {
    storeRegistry.resetAll();
    queryClient.clear();
  }

  /**
   * Factory to render a component wrapped with full GrayBox providers and scope.
   */
  public static render(ui: React.ReactElement, options?: GrayBoxHarnessOptions): GrayBoxHarness {
    if (options?.scope) {
      if (options.scope.org) useScopeStore.getState().selectOrg(options.scope.org);
      if (options.scope.branch) useScopeStore.getState().selectBranch(options.scope.branch);
    }
    const result = renderWithProviders(ui);
    return new GrayBoxHarness(result);
  }
}
