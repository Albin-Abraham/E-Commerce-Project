import { LoadingContext } from "./loading-context";
import { UIScope } from "./loading-ui.enum";

export class LoaderFactory {
  private static cache = new Map<string, LoadingContext>();

  static create(key: string, scope?: UIScope) {
    if (!this.cache.has(key))
      this.cache.set(key, new LoadingContext(key, scope));
    return this.cache.get(key)!;
  }
}
