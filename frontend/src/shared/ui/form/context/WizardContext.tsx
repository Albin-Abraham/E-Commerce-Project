import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * WizardContext
 *
 * Manages multi-step wizard navigation only.
 * Scoped to a single wizard instance — multiple wizards on the page
 * can each have their own WizardProvider without conflicting.
 *
 * Extracted from the old LayoutContext to keep surface concerns separate
 * from step-navigation concerns.
 *
 * @example
 * <WizardProvider initialStepId="step-1">
 *   <WizardStep />
 * </WizardProvider>
 */

export interface WizardContextValue {
  /** Whether wizard mode is enabled. */
  isWizard: boolean;
  /** The currently active step ID. */
  currentStepId: string;
  /** The ordered path of step IDs the user has navigated through (for backtracking). */
  history: string[];

  navigation: {
    /** Move to the next step by ID. Pushes current step onto history. */
    next: (nextId: string | null) => void;
    /** Return to the previous step via history pop. */
    back: () => void;
    /** Jump directly to any step (does not update history). */
    jump: (stepId: string) => void;
    /** Reset the wizard to a given starting step. */
    reset: (startStepId: string) => void;
  };
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export const WizardProvider: React.FC<{
  children: React.ReactNode;
  initialStepId?: string;
  isWizard?: boolean;
}> = ({ children, initialStepId = "", isWizard = false }) => {
  const [currentStepId, setCurrentStepId] = useState<string>(initialStepId);
  const currentStepIdRef = useRef(currentStepId);
  currentStepIdRef.current = currentStepId;

  const [history, setHistory] = useState<string[]>([]);

  const navigation = useMemo(
    () => ({
      next: (nextId: string | null) => {
        if (!nextId) return;
        setHistory((prev) => [...prev, currentStepIdRef.current]);
        setCurrentStepId(nextId);
      },
      back: () => {
        setHistory((prev) => {
          if (prev.length === 0) return prev;
          const newHistory = [...prev];
          const lastStepId = newHistory.pop();
          if (lastStepId !== undefined) {
            setCurrentStepId(lastStepId);
          }
          return newHistory;
        });
      },
      jump: (stepId: string) => {
        setCurrentStepId(stepId);
      },
      reset: (startStepId: string) => {
        setCurrentStepId(startStepId);
        setHistory([]);
      },
    }),
    []
  );

  const value: WizardContextValue = useMemo(
    () => ({
      isWizard,
      currentStepId,
      history,
      navigation,
    }),
    [isWizard, currentStepId, history, navigation]
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
};

export const useWizard = (): WizardContextValue => {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    return {
      isWizard: false,
      currentStepId: "",
      history: [],
      navigation: {
        next: () => {},
        back: () => {},
        jump: () => {},
        reset: () => {},
      },
    };
  }
  return ctx;
};
