import { LoadingState } from "./loading-state.enum";
import { UIScope } from "./loading-ui.enum";

export interface LoadingEvent {
  key: string;
  state: LoadingState;
  scope?: UIScope;
  message?: string;
  meta?: Record<string, any>;
  timestamp: number;
}
