import type {
  Branch,
  BusinessUnit,
  Company,
} from "@features/auth/services/session.types";
import { useAuthStore } from "@features/auth/store/auth.store";

/**
 * AuthManager (Stateful Application Service)
 *
 * Orchestrates the hierarchical authentication session flow.
 * Manages the selection of Company -> Business Unit -> Branch.
 */
export class AuthManager {
  private static instance: AuthManager;

  private constructor() {}

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * Select a Company
   * Resets Business Unit and Branch to ensure referential integrity.
   */
  public selectCompany(company: Company): void {
    useAuthStore.setState({
      sessionContext: {
        company,
        businessUnit: null,
        branch: null,
        isStable: false,
      },
    });
  }

  /**
   * Select a Business Unit
   * Resets Branch. Session is now stable (2-tier: company + BU).
   */
  public selectBusinessUnit(bu: BusinessUnit): void {
    const current = useAuthStore.getState().sessionContext;

    useAuthStore.setState({
      sessionContext: {
        ...current,
        businessUnit: bu,
        branch: null,
        isStable: true,
      },
    });
  }

  /**
   * Select a Branch
   * Finalizes the session context.
   */
  public selectBranch(branch: Branch): void {
    const current = useAuthStore.getState().sessionContext;

    useAuthStore.setState({
      sessionContext: {
        ...current,
        branch,
        isStable: true,
      },
    });
  }

  /**
   * Reset the entire session context
   */
  public resetContext(): void {
    useAuthStore.setState({
      sessionContext: {
        company: null,
        businessUnit: null,
        branch: null,
        isStable: false,
      },
    });
  }

  /**
   * Get current stability status
   */
  public isStable(): boolean {
    return useAuthStore.getState().sessionContext.isStable;
  }
}

export const authManager = AuthManager.getInstance();
