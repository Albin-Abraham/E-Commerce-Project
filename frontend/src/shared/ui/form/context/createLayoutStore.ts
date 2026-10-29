import { createStore } from "zustand";

export type LayoutMode =
  | "dashboard"
  | "portal"
  | "fullscreen"
  | "drawer"
  | "modal"
  | "inline";

export interface LayoutState {
  layoutMode?: LayoutMode;
  isPageHeaderActive: boolean;
  isPageFooterActive: boolean;

  // Wizard State
  currentStepId: string;
  history: string[];
  isWizard: boolean;

  // Content Hand-offs
  pageTitle?: string;
  pageDescription?: string;

  // Actions
  setLayoutMode: (mode: LayoutMode) => void;
  setFeatures: (features: { header?: boolean; footer?: boolean }) => void;
  setPageTitle: (title: string) => void;
  setPageDescription: (desc: string) => void;

  // Navigation
  navigation: {
    next: (nextId: string | null) => void;
    back: () => void;
    jump: (stepId: string) => void;
    reset: (startStepId: string) => void;
  };
}

export type LayoutStore = ReturnType<typeof createLayoutStore>;

export const createLayoutStore = (initProps?: Partial<LayoutState>) => {
  return createStore<LayoutState>()((set) => ({
    layoutMode: initProps?.layoutMode,
    isPageHeaderActive: initProps?.isPageHeaderActive ?? false,
    isPageFooterActive: initProps?.isPageFooterActive ?? false,
    currentStepId: initProps?.currentStepId ?? "",
    history: initProps?.history ?? [],
    isWizard: initProps?.isWizard ?? false,
    pageTitle: initProps?.pageTitle,
    pageDescription: initProps?.pageDescription,

    setLayoutMode: (mode) => set({ layoutMode: mode }),
    setFeatures: (f) =>
      set((state) => ({
        isPageHeaderActive: f.header ?? state.isPageHeaderActive,
        isPageFooterActive: f.footer ?? state.isPageFooterActive,
      })),
    setPageTitle: (title) => set({ pageTitle: title }),
    setPageDescription: (desc) => set({ pageDescription: desc }),

    navigation: {
      next: (nextId) => {
        if (!nextId) return;
        set((state) => ({
          history: [...state.history, state.currentStepId],
          currentStepId: nextId,
        }));
      },
      back: () => {
        set((state) => {
          if (state.history.length === 0) return state;
          const newHistory = [...state.history];
          const lastStepId = newHistory.pop();
          return {
            history: newHistory,
            currentStepId: lastStepId ?? state.currentStepId,
          };
        });
      },
      jump: (stepId) => set({ currentStepId: stepId }),
      reset: (startStepId) => set({ currentStepId: startStepId, history: [] }),
    },
  }));
};
