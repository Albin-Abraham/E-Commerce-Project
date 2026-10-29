import type { LoadingEvent } from "./loading-event.model";
import { LoadingState } from "./loading-state.enum";
import { UIScope } from "./loading-ui.enum";

export class LoadingService {
  private static _instance: LoadingService;
  private listeners = new Set<(event: LoadingEvent) => void>();
  private states = new Map<string, LoadingState>();
  private scopeStates = new Map<UIScope, LoadingState>();

  private constructor() {}

  static instance() {
    return (this._instance ??= new LoadingService());
  }

  dispatch(event: LoadingEvent) {
    this.states.set(event.key, event.state);
    if (event.scope) {
      this.scopeStates.set(event.scope, event.state);
    }
    for (const listener of this.listeners) listener(event);
  }

  subscribe(listener: (event: LoadingEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  isKeyLoading(key: string): boolean {
    const state = this.states.get(key);
    return state === LoadingState.Loading || state === LoadingState.Submitting;
  }

  isScopeLoading(scope: UIScope): boolean {
    const state = this.scopeStates.get(scope);
    return state === LoadingState.Loading || state === LoadingState.Submitting;
  }

  get isActive(): boolean {
    return Array.from(this.states.values()).some(
      (s) => s === LoadingState.Loading || s === LoadingState.Submitting
    );
  }
}
