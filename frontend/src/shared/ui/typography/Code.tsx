import React, { forwardRef } from "react";
import { cn } from "@libs/utils";
import { Text, type TextProps } from "./Text";

export interface CodeProps extends Omit<TextProps<"code">, "as"> {
  inline?: boolean;
}

export const Code = forwardRef<HTMLElement, CodeProps>(function Code(
  props,
  ref
) {
  const { inline = true, className, children, tabularNums = true, ...rest } = props;

  if (inline) {
    return (
      <Text
        as="code"
        variant="code"
        tabularNums={tabularNums}
        ref={ref}
        className={cn(
          "inline-block rounded px-1.5 py-0.5 text-sm bg-muted/10 text-foreground border border-border/40 font-mono",
          className
        )}
        {...rest}
      >
        {children}
      </Text>
    );
  }

  return (
    <pre
      ref={ref as any}
      className={cn(
        "rounded-md p-4 overflow-x-auto bg-subtle text-foreground border border-border/40 text-sm font-mono leading-relaxed",
        tabularNums && "tabular-nums",
        className
      )}
    >
      <code className="text-code font-mono">{children}</code>
    </pre>
  );
});

Code.displayName = "Code";
