import { useCallback, useEffect, useState } from "react";

// Define states
const STATES = {
  IDLE: "idle",
  INIT: "init",
  CHECK: "check",
  READY: "ready",
  RELOAD: "reload",
  ERROR: "error",
};

// Define transitions
const TRANSITIONS = {
  IDLE: { START: STATES.INIT },
  INIT: { CHECK: STATES.CHECK, ERROR: STATES.ERROR },
  CHECK: { READY: STATES.READY, RELOAD: STATES.RELOAD, ERROR: STATES.ERROR },
  READY: {},
  RELOAD: {},
  ERROR: {},
};

/**
 * Custom hook: useAppBoot
 * Handles app bootstrapping with async checks and optional reload
 */
export function useAppBoot({
  version,
  simulateAsyncCheck,
}: {
  version: string;
  simulateAsyncCheck?: () => Promise<boolean>;
}) {
  const [state, setState] = useState(STATES.IDLE);
  const [error, setError] = useState<Error | unknown | null>(null);

  // init phase: start boot sequence
  const init = useCallback(() => {
    if (state === STATES.IDLE) {
      setState(TRANSITIONS.IDLE.START);
    }
  }, [state]);

  // check phase: perform async boot checks
  const check = useCallback(async () => {
    if (state !== STATES.INIT && state !== STATES.CHECK) return;

    setState(TRANSITIONS.INIT.CHECK);

    try {
      const lastVersion = localStorage.getItem("appVersion");
      const bootOk = simulateAsyncCheck ? await simulateAsyncCheck() : true;

      if (!bootOk) {
        throw new Error("Boot check failed");
      }

      if (lastVersion !== version) {
        // version changed, trigger reload
        setState(TRANSITIONS.CHECK.RELOAD);
      } else {
        setState(TRANSITIONS.CHECK.READY);
      }
    } catch (err) {
      setError(err);
      setState(TRANSITIONS.CHECK.ERROR);
    }
  }, [state, version, simulateAsyncCheck]);

  // effect: handle reload
  useEffect(() => {
    if (state === STATES.RELOAD) {
      localStorage.setItem("appVersion", version);
      window.location.reload();
    }
  }, [state, version]);

  // effect: automatically run check after init
  useEffect(() => {
    if (state === STATES.INIT) {
      check();
    }
  }, [state, check]);

  return {
    state,
    error,
    init,
    check,
    isReady: state === STATES.READY,
    hasError: state === STATES.ERROR,
  };
}
