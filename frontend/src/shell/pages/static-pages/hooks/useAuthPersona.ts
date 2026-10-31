import { useState, useEffect, useCallback } from "react";
import { PlatformUrlAdapters } from "@core/router/adapters/PlatformUrlAdapters";
import type { PlatformUrlPort } from "@core/router/ports/PlatformUrlPort";
import {
  type AuthPersona,
  AUTH_PERSONAS,
  resolveAuthPersona,
  type PersonaConfig,
} from "../configs/auth-personas";

export interface UseAuthPersonaReturn {
  persona: AuthPersona | null;
  config: PersonaConfig | null;
  isPersonaSelection: boolean;
  selectPersona: (newPersona: AuthPersona) => void;
  clearPersona: () => void;
  normalizePersona: (targetPersona: AuthPersona) => void;
  urlPort: PlatformUrlPort;
}

/**
 * useAuthPersona
 *
 * ZenOS UrlSyncPlatform adapter hook for multi-persona authentication.
 *
 * Routing Contract:
 * - /login (no mode param) -> persona === null (Level 1: Persona Selection)
 * - /login?mode=customer|partner|staff -> persona is resolved (Level 2: Persona Authentication)
 * - Back button traversal restores previous level smoothly (replace: false)
 */
export function useAuthPersona(injectedPort?: PlatformUrlPort): UseAuthPersonaReturn {
  const defaultPort = PlatformUrlAdapters.useReactRouter({
    isGlobal: true,
    replace: true,
    debounceMs: 0,
  });

  const urlPort = injectedPort ?? defaultPort;

  const resolveCurrentPersona = () => {
    const rawParam = urlPort.get("mode") || urlPort.get("persona");
    return resolveAuthPersona(rawParam);
  };

  const [persona, setPersona] = useState<AuthPersona | null>(resolveCurrentPersona);

  // Synchronize when URL changes (e.g. popstate, external route changes)
  const currentParam = urlPort.get("mode") || urlPort.get("persona");
  useEffect(() => {
    const targetPersona = resolveAuthPersona(currentParam);
    if (targetPersona !== persona) {
      setPersona(targetPersona);
    }
  }, [currentParam]);

  // Deliberate user action: select a persona and push to browser history
  const selectPersona = useCallback(
    (newPersona: AuthPersona) => {
      setPersona(newPersona);
      urlPort.set(
        { mode: newPersona },
        { immediate: true, replace: false }
      );
    },
    [urlPort]
  );

  // Return to Level 1 Persona Selection: delete mode and push to browser history
  const clearPersona = useCallback(() => {
    setPersona(null);
    urlPort.delete(["mode", "persona"], { immediate: true, replace: false });
  }, [urlPort]);

  // Background normalization: replace history without creating duplicate entries
  const normalizePersona = useCallback(
    (targetPersona: AuthPersona) => {
      setPersona(targetPersona);
      urlPort.set(
        { mode: targetPersona },
        { immediate: true, replace: true }
      );
    },
    [urlPort]
  );

  const config = persona ? AUTH_PERSONAS[persona] : null;

  return {
    persona,
    config,
    isPersonaSelection: persona === null,
    selectPersona,
    clearPersona,
    normalizePersona,
    urlPort,
  };
}
