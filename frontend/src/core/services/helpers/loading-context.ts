import { LoadingService } from "./loading-service";
import { LoadingState } from "./loading-state.enum";
import { UIScope } from "./loading-ui.enum";

export class LoadingContext {
  constructor(
    public key: string,
    public scope?: UIScope
  ) {}

  private emit(state: LoadingState, message?: string) {
    LoadingService.instance().dispatch({
      key: this.key,
      scope: this.scope,
      state,
      message,
      timestamp: Date.now(),
    });
  }

  start(msg?: string) {
    this.emit(LoadingState.Loading, msg);
  }
  submitting(msg?: string) {
    this.emit(LoadingState.Submitting, msg);
  }
  success(msg?: string) {
    this.emit(LoadingState.Success, msg);
  }
  error(msg?: string) {
    this.emit(LoadingState.Error, msg);
  }
  reset() {
    this.emit(LoadingState.Idle);
  }
}
