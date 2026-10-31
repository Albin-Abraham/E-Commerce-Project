/**
 * Platform Configuration: Repository Runtime Mode Switcher
 *
 * Replaces silent accidental fallback with explicit, auditable modes.
 */

import { environment } from "./environment";

export type RepositoryMode = "production" | "development" | "test" | "storybook";

class RuntimeConfigManager {
  private mode: RepositoryMode;

  constructor() {
    if (environment.env === "production") {
      this.mode = "production";
    } else if (environment.env === "testing") {
      this.mode = "test";
    } else {
      this.mode = "development";
    }
  }

  public getRepositoryMode(): RepositoryMode {
    return this.mode;
  }

  public setRepositoryMode(mode: RepositoryMode): void {
    this.mode = mode;
  }

  public isProduction(): boolean {
    return this.mode === "production";
  }

  public isDevelopment(): boolean {
    return this.mode === "development";
  }

  public isTest(): boolean {
    return this.mode === "test";
  }

  public isStorybook(): boolean {
    return this.mode === "storybook";
  }
}

export const runtimeConfig = new RuntimeConfigManager();
