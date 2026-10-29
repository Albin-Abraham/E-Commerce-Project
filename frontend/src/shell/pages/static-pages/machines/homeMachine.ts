import { useEffect, useState } from "react";

/**
 * Lightweight Home Orchestration Hook
 * Manages the "Boot-to-Reveal" sequence without XState to save bundle size.
 */
export function useHomeMachine() {
  const [state, setState] = useState<
    "initializing" | "revealingHero" | "revealingContent" | "active" | "error"
  >("initializing");

  const send = (event: { type: string }) => {
    if (event.type === "BOOT_COMPLETE" && state === "initializing") {
      setState("revealingHero");
    } else if (event.type === "BOOT_FAIL" && state === "initializing") {
      setState("error");
    } else if (event.type === "RETRY") {
      setState("initializing");
    }
  };

  useEffect(() => {
    if (state === "revealingHero") {
      const timer = setTimeout(() => setState("revealingContent"), 800);
      return () => clearTimeout(timer);
    }
    if (state === "revealingContent") {
      const timer = setTimeout(() => setState("active"), 600);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return [
    {
      matches: (s: string) => state === s,
      value: state,
    },
    send,
  ] as const;
}
