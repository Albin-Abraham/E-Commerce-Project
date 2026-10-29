import React from "react";

import { cn } from "@ui/form/utils/form-styles";

/**
 * @file FieldSkeleton.tsx
 *
 * Loading placeholders shaped after the field *type* or *component* they are
 * loading for. Used in two ways:
 *
 * 1. Automatically — as the `<Suspense>` fallback inside `FieldRenderer`, so a
 *    lazy field (e.g. a dynamically imported component) renders a skeleton that
 *    matches its own type/component instead of a generic bar.
 * 2. Explicitly — `<FieldSkeleton type="card" />` anywhere a fine-grained
 *    loading state is needed (cards, previews, query states).
 *
 * `CardSkeleton` is the structure-level skeleton for the `card` type and
 * mirrors `CardField`'s chrome (header / body / footer).
 */

export interface FieldSkeletonProps {
  /** Field type as authored in the schema (`text`, `select`, `card`, …). */
  type?: string;
  /** Optional component override (`textarea`, `switch`, `date`, …). */
  component?: string;
  /** Structural: how many child placeholders to render inside containers. */
  rows?: number;
  className?: string;
  "data-skeleton"?: string;
}

const SkeletonBar: React.FC<{
  className?: string;
  style?: React.CSSProperties;
}> = ({ className, style }) => (
  <div
    className={cn(
      "bg-muted/20 animate-pulse rounded-[var(--radius-sm)]",
      className
    )}
    style={style}
  />
);

/** Label + control rows used for input/field placeholders. */
export const FieldRowSkeleton: React.FC<{
  labelWidth?: string;
  controlClassName?: string;
}> = ({ labelWidth = "w-1/4", controlClassName = "h-10" }) => (
  <div className="space-y-2">
    <SkeletonBar className={cn("h-3", labelWidth)} />
    <SkeletonBar className={cn("w-full", controlClassName)} />
  </div>
);

/**
 * Card-shaped skeleton. Mirrors `CardField` chrome: an optional header
 * (title + description bars), a body of `rows` label/control placeholders,
 * and an optional footer action bar.
 */
export const CardSkeleton: React.FC<
  FieldSkeletonProps & {
    header?: boolean;
    footer?: boolean;
  }
> = ({
  header = true,
  footer = false,
  rows = 3,
  className,
  ...dataProps
}) => (
  <div
    data-skeleton="card"
    role="status"
    aria-label="Card loading"
    className={cn(
      "bg-surface/90 backdrop-blur-md rounded-2xl border border-border/40 overflow-hidden",
      "animate-pulse",
      className
    )}
    {...dataProps}
  >
    {header && (
      <div className="border-b border-border/40 bg-subtle/30 px-6 py-4 space-y-2">
        <SkeletonBar className="h-4 w-1/3 rounded-full" />
        <SkeletonBar className="h-3 w-2/3" />
      </div>
    )}
    <div className="p-6 space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <FieldRowSkeleton key={i} />
      ))}
    </div>
    {footer && (
      <div className="border-t border-border/40 px-6 py-4 flex gap-3 justify-end">
        <SkeletonBar className="h-9 w-24 rounded-lg" />
        <SkeletonBar className="h-9 w-24 rounded-lg" />
      </div>
    )}
  </div>
);

const INPUT_PLACEHOLDERS: Record<string, string> = {
  textarea: "h-24",
  code: "h-12 font-mono",
  phone: "h-10",
  date: "h-10",
  datetime: "h-10",
  time: "h-10",
  file: "h-12",
  image: "h-24",
  slider: "h-2 rounded-full",
  range: "h-2 rounded-full",
  rating: "h-8",
  number: "h-10",
  "formatted-number": "h-10",
};

const STATIC_PLACEHOLDERS: Record<string, React.ReactNode> = {
  header: <SkeletonBar className="h-7 w-1/2 rounded-lg" />,
  paragraph: (
    <div className="space-y-2">
      <SkeletonBar className="h-3 w-full" />
      <SkeletonBar className="h-3 w-full" />
      <SkeletonBar className="h-3 w-2/3" />
    </div>
  ),
  divider: <SkeletonBar className="h-px w-full rounded-none" />,
  "divider-label": (
    <div className="flex items-center gap-3">
      <SkeletonBar className="h-px flex-1 rounded-none" />
      <SkeletonBar className="h-3 w-20" />
      <SkeletonBar className="h-px flex-1 rounded-none" />
    </div>
  ),
  button: <SkeletonBar className="h-10 w-32 rounded-xl" />,
  image: <SkeletonBar className="h-32 w-full rounded-xl" />,
  "qr-code": <SkeletonBar className="h-32 w-32 rounded-xl" />,
  spacer: <div className="h-4" />,
};

function inputSkeleton(component?: string) {
  const control = INPUT_PLACEHOLDERS[component || ""] || "h-10";
  return (
    <div className="space-y-2">
      <SkeletonBar className="h-3 w-1/4" />
      <div className="relative">
        <SkeletonBar className={cn("w-full", control)} />
        {component === "select" ||
        component === "autocomplete" ||
        component === "multiselect" ? (
          <SkeletonBar className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded" />
        ) : null}
      </div>
    </div>
  );
}

function toggleSkeleton(component?: string) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <SkeletonBar className="h-3 w-2/5" />
      <div className="flex items-center gap-2">
        <SkeletonBar
          className={cn(
            "rounded-full",
            component === "switch" ? "h-5 w-9" : "h-5 w-5"
          )}
        />
        <SkeletonBar className="h-3 w-10" />
      </div>
    </div>
  );
}

function choiceSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonBar className="h-3 w-1/4" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonBar className="h-4 w-4 rounded-full" />
          <SkeletonBar className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function accordionSkeleton(rows = 3) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between border border-border/50 rounded-xl px-4 py-3"
        >
          <SkeletonBar className="h-3 w-1/3" />
          <SkeletonBar className="h-3 w-3" />
        </div>
      ))}
    </div>
  );
}

function tabsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-6 border-b border-border/40 pb-2">
        <SkeletonBar className="h-6 w-20 rounded" />
        <SkeletonBar className="h-6 w-24 rounded" />
        <SkeletonBar className="h-6 w-16 rounded" />
      </div>
      <FieldRowSkeleton />
    </div>
  );
}

function repeaterSkeleton(rows = 2) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-3 border border-border/40 rounded-xl p-4">
          <SkeletonBar className="h-4 w-1/4" />
          <SkeletonBar className="h-10 w-full" />
        </div>
      ))}
      <SkeletonBar className="h-10 w-32 rounded-xl" />
    </div>
  );
}

function structureSkeleton(type: string, rows = 3) {
  switch (type) {
    case "card":
      return <CardSkeleton rows={rows} />;
    case "accordion":
      return accordionSkeleton(rows);
    case "tabs":
      return tabsSkeleton();
    case "repeater":
      return repeaterSkeleton(rows);
    case "slot":
      return <CardSkeleton header={false} footer rows={1} />;
    case "container":
    case "fieldset":
    case "group":
    default:
      return (
        <div className="space-y-3 border border-border/40 rounded-xl p-4">
          <SkeletonBar className="h-4 w-1/3" />
          {Array.from({ length: Math.min(rows, 3) }).map((_, i) => (
            <FieldRowSkeleton key={i} />
          ))}
        </div>
      );
  }
}

/**
 * Type/component-aware skeleton. Falls back to a generic field placeholder for
 * unknown types so it never renders blank.
 */
export const FieldSkeleton: React.FC<FieldSkeletonProps> = ({
  type,
  component,
  rows = 3,
  className,
  ...dataProps
}) => {
  let content: React.ReactNode;

  switch (type) {
    case "header":
    case "paragraph":
    case "divider":
    case "divider-label":
    case "button":
    case "image":
    case "qr-code":
    case "spacer":
      content = STATIC_PLACEHOLDERS[type];
      break;

    case "checkbox":
    case "switch":
    case "boolean":
      content = toggleSkeleton(component);
      break;

    case "radio":
    case "select":
      content =
        component === "radio" ? choiceSkeleton() : inputSkeleton(component);
      break;

    case "card":
    case "accordion":
    case "tabs":
    case "repeater":
    case "slot":
    case "container":
    case "fieldset":
    case "group":
    case "section":
      content = structureSkeleton(type, rows);
      break;

    default:
      content = inputSkeleton(component);
      break;
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      data-field-type={type}
      className={cn("w-full", className)}
      {...dataProps}
    >
      {content}
    </div>
  );
};

export default FieldSkeleton;