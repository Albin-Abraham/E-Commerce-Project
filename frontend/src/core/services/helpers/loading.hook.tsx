import { useEffect, useState } from "react";

import { LoadingService } from "./loading-service";
import { LoadingState } from "./loading-state.enum";

export function useLoader(key: string) {
  const [state, setState] = useState<LoadingState>(LoadingState.Idle);

  useEffect(() => {
    const unsub = LoadingService.instance().subscribe((e) => {
      if (e.key === key) setState(e.state);
    });
    return () => {
      unsub();
    };
  }, [key]);

  return {
    state,
    isLoading: state === LoadingState.Loading,
    isSubmitting: state === LoadingState.Submitting,
    isSuccess: state === LoadingState.Success,
    isError: state === LoadingState.Error,
  };
}
