import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";

/**
 * @file ControlContext.tsx
 * @description Imperative control API for individual field drivers.
 *
 * The ControlContext is the "ControlManager" mentioned in the architecture chat.
 * It gives field drivers and external orchestrators an imperative handle to:
 * - `focus(fieldId)` — programmatically focus a field
 * - `blur(fieldId)` — programmatically blur a field
 * - `scrollIntoView(fieldId)` — scroll a field into the viewport
 *
 * ## Design
 * Field drivers register their DOM ref on mount via `useFieldControl(fieldId)`.
 * External code (e.g., on validation error) calls `controlManager.focus(fieldId)`.
 *
 * Analogous to React's `ref`-forwarding pattern, but centralized so that
 * any orchestrator (FormValidator, error summary, accessibility runtime)
 * can control any field without knowing its position in the tree.
 *
 * ## Usage
 *
 * ### Inside a field driver:
 * ```tsx
 * const ref = useFieldControl(field.id);
 * return <input ref={ref} ... />;
 * ```
 *
 * ### From FormValidator or error summary:
 * ```ts
 * const control = useControlManager();
 * control.focus("email_field_id");       // focuses the email input
 * control.scrollIntoView("phone_id");    // scrolls it into view
 * ```
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface ControlManagerValue {
  /**
   * Register a field element ref. Called internally by `useFieldControl()`.
   * Do not call this directly from field components — use the hook instead.
   */
  register: (fieldId: string, el: HTMLElement | null) => void;

  /** Programmatically focus a registered field. */
  focus: (fieldId: string) => void;

  /** Programmatically blur a registered field. */
  blur: (fieldId: string) => void;

  /**
   * Scroll a registered field into view.
   * @param fieldId - The field ID to scroll to.
   * @param options - Standard ScrollIntoViewOptions.
   */
  scrollIntoView: (fieldId: string, options?: ScrollIntoViewOptions) => void;
}

// ── Context ─────────────────────────────────────────────────────────────────

const ControlContext = createContext<ControlManagerValue | undefined>(
  undefined
);

/**
 * `ControlProvider` — wraps the form tree to enable imperative field control.
 *
 * Place at the same level as `FormOrchestratorProvider`.
 */
export const ControlProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const registry = useRef<Map<string, HTMLElement>>(new Map());

  const register = useCallback((fieldId: string, el: HTMLElement | null) => {
    if (el) {
      registry.current.set(fieldId, el);
    } else {
      registry.current.delete(fieldId);
    }
  }, []);

  const focus = useCallback((fieldId: string) => {
    const el = registry.current.get(fieldId);
    if (el && typeof (el as HTMLInputElement).focus === "function") {
      (el as HTMLInputElement).focus();
    }
  }, []);

  const blur = useCallback((fieldId: string) => {
    const el = registry.current.get(fieldId);
    if (el && typeof (el as HTMLInputElement).blur === "function") {
      (el as HTMLInputElement).blur();
    }
  }, []);

  const scrollIntoView = useCallback(
    (
      fieldId: string,
      options: ScrollIntoViewOptions = { behavior: "smooth", block: "center" }
    ) => {
      const el = registry.current.get(fieldId);
      el?.scrollIntoView(options);
    },
    []
  );

  const value: ControlManagerValue = useMemo(
    () => ({ register, focus, blur, scrollIntoView }),
    [register, focus, blur, scrollIntoView]
  );

  return (
    <ControlContext.Provider value={value}>{children}</ControlContext.Provider>
  );
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * `useControlManager` — access the imperative control API.
 *
 * @example
 * // Jump focus to first invalid field after submit:
 * const control = useControlManager();
 * control.focus(firstInvalidFieldId);
 * control.scrollIntoView(firstInvalidFieldId);
 */
export const useControlManager = (): ControlManagerValue => {
  const ctx = useContext(ControlContext);
  if (!ctx) {
    return {
      register: () => {},
      focus: () => {},
      blur: () => {},
      scrollIntoView: () => {},
    };
  }
  return ctx;
};

/**
 * `useFieldControl` — called inside a field driver to register the element ref.
 *
 * Returns a `React.RefCallback` to attach to the field's root element.
 * The ref is automatically cleaned up on unmount.
 *
 * @example
 * const controlRef = useFieldControl(field.id);
 * return <input ref={controlRef} type="text" ... />;
 */
export const useFieldControl = (
  fieldId: string
): React.RefCallback<HTMLElement> => {
  const ctx = useContext(ControlContext);

  return useCallback(
    (el: HTMLElement | null) => {
      ctx?.register(fieldId, el);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fieldId]
  );
};
