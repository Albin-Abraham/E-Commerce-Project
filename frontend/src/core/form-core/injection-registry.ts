/**
 * @file injection-registry.ts
 * @description Global registry for reusable schema fragments (Prefabs).
 *
 * Part of the DCS (Data Component System) philosophy: Define common
 * data structures once and inject them into forms to avoid boilerplate.
 */
import type { FormField } from "./domain";

export type InjectionFragment = FormField[] | ((metadata: any) => FormField[]);

class InjectionRegistry {
  private static instance: InjectionRegistry;
  private fragments: Map<string, InjectionFragment> = new Map();

  private constructor() {}

  public static getInstance(): InjectionRegistry {
    if (!InjectionRegistry.instance) {
      InjectionRegistry.instance = new InjectionRegistry();
    }
    return InjectionRegistry.instance;
  }

  /**
   * Registers a named fragment of fields.
   * @param name - The identifier for the injection (e.g., "bu-branch-fields").
   * @param fragment - The array of fields or a function that returns them.
   */
  public register(name: string, fragment: InjectionFragment) {
    this.fragments.set(name, fragment);
  }

  /**
   * Retrieves a fragment by name, resolving functions if necessary.
   */
  public get(name: string, metadata: any = {}): FormField[] | undefined {
    const fragment = this.fragments.get(name);
    if (typeof fragment === "function") {
      return fragment(metadata);
    }
    return fragment;
  }
}

export const injectionRegistry = InjectionRegistry.getInstance();
export { InjectionRegistry };
