import React, { useMemo } from "react";

import { FormComposer } from "@ui/form/FormComposer";
import { useFormShell } from "@ui/form/context/FormShellContext";
import type { ContentNode } from "@ui/form/types/layout";
import { cn } from "@ui/form/utils/form-styles";
import { SchemaNormalizer } from "@ui/form/utils/SchemaNormalizer";

export interface FormContentRendererProps {
  content?: ContentNode;
}

export const FormContentRenderer: React.FC<FormContentRendererProps> = ({
  content,
}) => {
  const { definition, getComponentProps, visibility } = useFormShell();
  const nodes = useMemo(
    () => SchemaNormalizer.normalize(definition as any),
    [definition]
  );
  if (!content) return null;

  switch (content.type) {
    case "image":
      return (
        <div className={cn("relative w-full h-full", content.className)}>
          {content.src && (
            <img
              src={content.src}
              alt={content.alt || "Decoration"}
              className="object-cover w-full h-full"
            />
          )}
          {content.overlay && <div className="absolute inset-0 bg-black/40" />}
        </div>
      );
    case "html":
      return (
        <div
          className={cn("w-full", content.className)}
          dangerouslySetInnerHTML={{ __html: content.content || "" }}
        />
      );
    case "section-ref": {
      if (!content.sectionId) return null;
      const targetNodes = nodes.filter((n) => n.id === content.sectionId);
      return (
        <div className={cn("w-full", content.className)}>
          <FormComposer
            fields={targetNodes}
            getComponentProps={getComponentProps}
            visibility={visibility}
            fillVertical
          />
        </div>
      );
    }

    case "segmented": {
      const active = content.value;
      return (
        <div
          className={cn("w-full", content.className)}
          data-testid="auth-mode-toggle"
        >
          <div
            role="radiogroup"
            className="flex w-full p-1 rounded-xl bg-muted/60 dark:bg-muted/30 border border-border/40 shadow-inner"
          >
            {(content.options || []).map((option) => {
              const selected = active === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => content.onChange?.(option.value)}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-[var(--motion-fast)] ease-out active:scale-[0.97] motion-reduce:transition-none",
                    selected
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    case "component": {
      const Component = content.component;
      if (!Component) return <div>[Component {content.content}]</div>;
      return (
        <div className={cn("w-full h-full", content.className)}>
          <Component {...(content.componentProps || {})} />
        </div>
      );
    }
    default:
      return null;
  }
};
