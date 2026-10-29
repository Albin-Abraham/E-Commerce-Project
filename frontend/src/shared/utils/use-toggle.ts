// use-toggle.ts
import { useSelector } from "@xstate/react";

// @ts-ignore - The action module might not exist yet
import { toggleActor } from "@libs/state-machine/toggle.action";

export function useToggle() {
  const state = useSelector(toggleActor, (snapshot) => snapshot.value);

  const toggle = () => toggleActor.send({ type: "TOGGLE" });

  return { state, toggle };
}
