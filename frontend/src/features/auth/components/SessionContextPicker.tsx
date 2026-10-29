/**
 * SessionContextPicker
 *
 * Workspace configuration UI — powered by the Form Engine.
 *
 * Architecture:
 *  - Schema is built from `buildWorkspaceSchema()`.
 *  - Options are injected into the schema per render. To ensure the Form Engine
 *    catches API updates (e.g., business units finish loading), we include the
 *    loading states and lengths in the Form's `key`.
 *  - Form payload is committed to the Zustand store in one atomic call on Submit.
 */
import React, { useRef } from "react";

import { PageSkeleton } from "@ui/PageSkeleton";
import { Form } from "@ui/form/Form";
import type { FormHandle } from "@ui/form/Form";

import { authManager } from "@features/auth/services/auth-manager";
import type {
  Branch,
  BusinessUnit,
  Company,
} from "@features/auth/services/session.types";
import { useSessionFlow } from "@features/auth/services/useSessionFlow";

import type { WorkspaceFormData } from "./configs/workspace-logical";
import { buildWorkspaceSchema } from "./configs/workspace-schema";

/* ─────────────────────────────────────────────────────────────────────────────
   Props
───────────────────────────────────────────────────────────────────────────── */
interface SessionContextPickerProps {
  onLaunch?: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */
export default function SessionContextPicker({
  onLaunch,
}: SessionContextPickerProps = {}) {
  // ── Auth state & companies list ─────────────────────────────────────────
  const {
    companies,
    isLoading: loadingCompanies,
    isAuthenticated,
    reset,
  } = useSessionFlow();

  const formRef = useRef<FormHandle<WorkspaceFormData>>(null);

  // ── Build schema with static compilation ───────────────────────────
  const schema = React.useMemo(
    () =>
      buildWorkspaceSchema({
        onReset: () => {
          reset();
          formRef.current?.reset();
        },
      }),
    [reset]
  );

  if (!isAuthenticated) return null;
  if (loadingCompanies && companies.length === 0) return <PageSkeleton />;

  // ── Handle form submission ──────────────────────────────────────────────
  async function handleSubmit(data: WorkspaceFormData) {
    const company = companies.find((c: Company) => c.id === data.company_id);

    // Resolve BU and Branch objects using the form state (which populated them via RemoteOptionsManager)
    const state = (formRef.current?.engine as any)?.stateManager?.state ?? formRef.current?.engine?.state;
    const buOptions = state?.view["business_unit_id"]?.options || [];
    const branchOptions = state?.view["branch_id"]?.options || [];

    const buOption = buOptions.find(
      (o: any) => o.value === data.business_unit_id
    );
    const branchOption = branchOptions.find(
      (o: any) => o.value === data.branch_id
    );

    const bu = buOption
      ? ({
          id: data.business_unit_id,
          name: buOption.label,
          code: data.business_unit_id,
          companyId: data.company_id,
          isActive: true,
        } as unknown as BusinessUnit)
      : undefined;
    const branch =
      branchOption && data.branch_id
        ? ({
            id: data.branch_id,
            name: branchOption.label,
            code: data.branch_id,
            businessUnitId: data.business_unit_id,
            isActive: true,
          } as unknown as Branch)
        : undefined;

    if (company) authManager.selectCompany(company);
    if (bu) authManager.selectBusinessUnit(bu);
    if (branch) authManager.selectBranch(branch);

    if (onLaunch) setTimeout(onLaunch, 150);
  }

  // The form Key is now static. We rely purely on the Form Engine's reactive logic
  // (e.g. RemoteOptionsManager) to handle the network requests.
  const formKey = "workspace-form";

  // ── Shared form element ─────────────────────────────────────────────────
  const form = (
    <Form<WorkspaceFormData>
      key={formKey}
      ref={formRef}
      definition={schema}
      onSubmit={handleSubmit}
      middleware={[
        async ({ form, fieldId }) => {
          if (fieldId === "company_id") {
            form.setValue("business_unit_id", "");
            form.setValue("branch_id", "");
          } else if (fieldId === "business_unit_id") {
            form.setValue("branch_id", "");
          }
        },
      ]}
    />
  );

  // ── Routed mode (WorkspacePage at /workspace) ───────────────────────────
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        padding: "0 16px",
      }}
    >
      {form}
    </div>
  );
}
