import React, { useEffect, useMemo } from "react";

import { ErrorBoundary } from "@ui/common/ErrorBoundary";
import { FormComposer } from "@ui/form/FormComposer";
import { FormValidationSummary } from "@ui/form/components/FormValidationSummary";
import { useFormShell } from "@ui/form/context/FormShellContext";
import { useLayout } from "@ui/form/context/LayoutContext";
import { useValidationJump } from "@ui/form/hooks/useValidationJump";
import { FormBody } from "@ui/form/shell/FormBody";
import { FormContentRenderer } from "@ui/form/shell/FormContentRenderer";
import { FormFooter } from "@ui/form/shell/FormFooter";
import { FormHeader } from "@ui/form/shell/FormHeader";
import { FormStepper } from "@ui/form/shell/FormStepper";
import { FormDebugOverlay } from "@ui/form/tools/FormDebugOverlay";
import { FormDevTools } from "@ui/form/tools/FormDevTools";
import type { ContentNode, FlowNode, ShellNode } from "@ui/form/types/layout";
import { SchemaNormalizer } from "@ui/form/utils/SchemaNormalizer";
import { generateDefaultSplitShell } from "@ui/form/shell/split-shell-factory";
import { generateDefaultWizardShell } from "@ui/form/shell/wizard-shell-factory";

import { Grid, GridItem } from "../../layout/Grid";
import { VStack } from "../../layout/VStack";

/**
 * @file FormShell.tsx
 *
 * Unified Form Shell.
 *
 * It seamlessly supports both simple forms and multi-step "wizard" flows via the
 * model-driven `definition.shell` architecture. It automatically handles "stepper"
 * structures and step filtering based on the surface context (`isWizard`).
 */

/**
 * Hook-using branches of the shell tree live in their own components so that
 * `RootShellRenderer` stays a pure, hook-free dispatcher. Calling these hooks
 * inline inside `if (node.node === ...)` branches made the hook count depend on
 * the node type, so a node changing type between renders (layout -> flow)
 * would break the Rules of Hooks. It also meant the provider-free layout and
 * surface branches, which never need the shell context, would have had to
 * start calling `useFormShell()` -- which throws without a provider.
 */
const FlowShellRenderer: React.FC<{
  node: FlowNode;
  renderStandardForm: () => React.ReactNode;
}> = ({ node, renderStandardForm }) => {
  const { definition, visibility } = useFormShell();
  const type = node.type;
  const config = node.config || {};
  const isSidebar = config.stepperPosition === "sidebar" || type === "wizard";

  if (type === "wizard" || type === "stepper") {
    return (
      <Grid columns={12} className={isSidebar ? "gap-[var(--space-8)]" : node.className}>
        {isSidebar && (
          <GridItem colSpan={{ base: 12, lg: 3 } as any}>
            <FormStepper
              definition={definition as any}
              type="sidebar"
              visibility={visibility}
              linear={config.linear}
            />
          </GridItem>
        )}
        <GridItem colSpan={isSidebar ? ({ base: 12, lg: 9 } as any) : 12}>
          {!isSidebar && (
            <FormStepper
              definition={definition as any}
              type="top"
              visibility={visibility}
              linear={config.linear}
            />
          )}
          {node.children.map((child, i) => (
            <RootShellRenderer key={i} node={child} renderStandardForm={renderStandardForm} />
          ))}
        </GridItem>
      </Grid>
    );
  }
  return <div className={node.className}>[Flow: {node.type}]</div>;
};

const ContentStepperRenderer: React.FC<{ node: ContentNode }> = ({ node }) => {
  const { definition, visibility } = useFormShell();
  // Wizard-ness comes from the schema's `settings.wizard.enabled`.
  // This previously read `orchestrator.surface.isWizard`, but `surface` is never
  // set on FormOrchestratorValue -- so it was permanently `undefined` and the
  // stepper, step filtering and onStepChange below were all dead code.
  const isWizard = definition?.settings?.wizard?.enabled === true;
  const { className, ...restProps } = node as any;
  const wizardSettings = (definition?.settings as any)?.wizard || {};
  const stepperType =
    restProps.stepperType ||
    (restProps.type === "sidebar" || restProps.type === "top"
      ? restProps.type
      : wizardSettings.stepperType || "sidebar");

  if (!isWizard) return null;

  return (
    <GridItem
      colSpan={
        (node as any).colSpan ||
        (stepperType === "sidebar" ? { base: 12, lg: 3 } : 12)
      }
      className={className}
      {...restProps}
    >
      <FormStepper
        definition={definition as any}
        type={stepperType}
        visibility={visibility}
      />
    </GridItem>
  );
};

const RootShellRenderer: React.FC<{
  node: ShellNode;
  renderStandardForm: () => React.ReactNode;
}> = ({ node, renderStandardForm }) => {
  if (node.node === "layout") {
    const { columns, gap, ...restConfig } = node.config || {};
    if (node.type === "grid") {
      return (
        <Grid columns={(columns as any) || 12} gap={gap as any} className={node.className} {...restConfig}>
          {node.children.map((child, i) => (
            <RootShellRenderer
              key={i}
              node={child}
              renderStandardForm={renderStandardForm}
            />
          ))}
        </Grid>
      );
    }
    return (
      <div className={node.className} {...restConfig}>
        {node.children.map((child, i) => (
          <RootShellRenderer
            key={i}
            node={child}
            renderStandardForm={renderStandardForm}
          />
        ))}
      </div>
    );
  }

  if (node.node === "surface") {
    const { ...restConfig } = node.config || {};
    const dataPane =
      (node as any)["data-pane"] || (node.config as any)?.["data-pane"];
    return (
      <GridItem
        colSpan={(node as any).colSpan}
        className={node.className}
        {...(dataPane ? { "data-pane": dataPane } : {})}
        {...restConfig}
      >
        {node.children.map((child, i) => (
          <RootShellRenderer
            key={i}
            node={child}
            renderStandardForm={renderStandardForm}
          />
        ))}
      </GridItem>
    );
  }

  if (node.node === "flow") {
    return <FlowShellRenderer node={node} renderStandardForm={renderStandardForm} />;
  }

  if (node.node === "content") {
    if ((node.type as string) === "stepper") {
      return <ContentStepperRenderer node={node} />;
    }
    if (node.type === "form-standard") {
      return <>{renderStandardForm()}</>;
    }
    if (node.type === "form-steps") {
      return (
        <GridItem
          colSpan={(node as any).colSpan || { base: 12, lg: 9 }}
          className={(node as any).className}
        >
          <StepRenderer />
        </GridItem>
      );
    }
    return <FormContentRenderer content={node as any} />;
  }

  return null;
};

const StepRenderer: React.FC = () => {
  const { definition, getComponentProps, visibility } = useFormShell();
  // Wizard-ness comes from the schema's `settings.wizard.enabled`.
  // This previously read `orchestrator.surface.isWizard`, but `surface` is never
  // set on FormOrchestratorValue -- so it was permanently `undefined` and the
  // stepper, step filtering and onStepChange below were all dead code.
  const isWizard = definition?.settings?.wizard?.enabled === true;
  const { currentStepId } = useLayout();

  const nodes = useMemo(
    () => SchemaNormalizer.normalize(definition as any),
    [definition]
  );

  const activeNodes = useMemo(() => {
    return isWizard ? nodes.filter((node) => node.id === currentStepId) : nodes;
  }, [nodes, currentStepId, isWizard]);

  return (
    <div
      key={isWizard ? currentStepId : "form"}
      className={
        isWizard ? "animate-in fade-in slide-in-from-right-4 duration-500" : ""
      }
    >
      <ErrorBoundary
        fallback={
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-mono">
            <strong>Form Composer Crash:</strong> Failed to render this step.
            Check schema for invalid field types.
          </div>
        }
      >
        <FormComposer
          fields={activeNodes}
          getComponentProps={getComponentProps}
          visibility={visibility}
        />
      </ErrorBoundary>
    </div>
  );
};

export const FormShell: React.FC<{
  children?: React.ReactNode;
  onStepChange?: (stepId: string, stepIndex: number) => void;
}> = ({ children, onStepChange }) => {
  const {
    definition,
    form,
    slots,
    className,
    debug,
    isSubmitting,
    actionClasses,
    submitBtnClass,
    cancelButtonClass,
    onExecuteSubmit,
    handleDelegatedChange,
    handleDelegatedBlur,
    shell: SurfaceShell,
    secondaryActions,
  } = useFormShell();

  // Wizard-ness comes from the schema's `settings.wizard.enabled`.
  // This previously read `orchestrator.surface.isWizard`, but `surface` is never
  // set on FormOrchestratorValue -- so it was permanently `undefined` and the
  // stepper, step filtering and onStepChange below were all dead code.
  const isWizard = definition?.settings?.wizard?.enabled === true;
  const { currentStepId } = useLayout();

  const handleValidationJump = useValidationJump();

  const nodes = useMemo(
    () => SchemaNormalizer.normalize(definition as any),
    [definition]
  );

  // Trigger step change
  useEffect(() => {
    if (isWizard && onStepChange) {
      const stepIndex = Math.max(
        nodes.findIndex((n) => n.id === currentStepId),
        0
      );
      onStepChange(currentStepId, stepIndex);
    }
  }, [currentStepId, isWizard, onStepChange, nodes]);

  const densityToGap = {
    compact: "sm",
    comfortable: "md",
    spacious: "lg",
  } as const;

  const gapSpacing = SurfaceShell
    ? "none"
    : definition.settings?.density
      ? densityToGap[definition.settings.density]
      : "md";

  const footer = !definition.settings?.hideFooter ? (
    <FormFooter
      definition={definition as any}
      form={form}
      sticky={definition.settings?.stickyFooter}
      slots={SurfaceShell ? { ...slots, footer: "" } : slots}
      className={SurfaceShell ? "contents" : undefined}
      isSubmitting={isSubmitting}
      actionClasses={
        SurfaceShell ? "flex items-center gap-4 justify-end" : actionClasses
      }
      submitBtnClass={submitBtnClass}
      cancelBtnClass={cancelButtonClass}
      onExecuteSubmit={onExecuteSubmit}
      secondaryActions={secondaryActions}
    />
  ) : null;

  const isSplit =
    definition.layout === "split" ||
    definition.containers?.some((c) => c.type === "split");

  const activeShell = definition.shell?.length
    ? definition.shell
    : isWizard
      ? generateDefaultWizardShell(definition as any)
      : isSplit
        ? generateDefaultSplitShell(definition as any)
        : [];

  const body = (
    <FormBody
      definition={definition as any}
      useInternalScroll={!!definition.settings?.maxHeight}
      slots={slots}
    >
      <FormValidationSummary
        valid={form.validity.valid}
        touched={form.vitality.touched}
      />
      {activeShell.length > 0 ? (
        activeShell.map((node, i) => (
          <RootShellRenderer
            key={i}
            node={node}
            renderStandardForm={() => <StepRenderer />}
          />
        ))
      ) : (
        <StepRenderer />
      )}
    </FormBody>
  );

  const renderStandardForm = () => {
    if (SurfaceShell) {
      return <SurfaceShell body={body} footer={footer} />;
    }

    return (
      <>
        <FormHeader
          definition={definition as any}
          sticky={definition.settings?.stickyHeader}
          slots={slots}
        />
        {body}
        {footer}
      </>
    );
  };

  return (
    <VStack
      asChild
      gap={gapSpacing as any}
      className={`${slots.root} ${className} text-[length:var(--text-base)] text-foreground${SurfaceShell ? " min-h-0 max-h-full" : ""}`}
      style={{
        height: definition.settings?.maxHeight ? "100%" : "auto",
        maxHeight: SurfaceShell ? "100%" : undefined,
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const isValid = await onExecuteSubmit();
          if (isValid === false) {
            handleValidationJump();
          }
        }}
        onChange={handleDelegatedChange}
        onBlur={handleDelegatedBlur}
        noValidate
        autoComplete="off"
        data-testid={`form-${definition.id}`}
        data-form-shell
      >
        {children ? (
          <>
            <FormValidationSummary
              valid={form.validity.valid}
              touched={form.vitality.touched}
            />
            {children}
          </>
        ) : (
          renderStandardForm()
        )}

        {debug && <FormDevTools form={form.engine} />}
        {debug && <FormDebugOverlay enabled={debug} />}
      </form>
    </VStack>
  );
};