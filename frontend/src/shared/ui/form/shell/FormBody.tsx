import { classNames } from "@ui/form/utils/field-utils";

import type { FormDefinition } from "../types";

export interface FormBodyProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children" | "className"
> {
  definition: FormDefinition;
  children: React.ReactNode;
  className?: string;
  useInternalScroll?: boolean;
  slots?: Record<string, string>;
}

export const FormBody: React.FC<FormBodyProps> = ({
  definition,
  children,
  className,
  slots = {},
  useInternalScroll,
  ...props
}) => {
  const maxHeight = definition.settings?.maxHeight;

  return (
    <div
      className={classNames(
        slots.body,
        className,
        maxHeight && "flex-grow overflow-y-auto pr-1"
      )}
      style={{
        maxHeight: maxHeight || "none",
        minHeight: 0, // Required for flex-grow with overflow
        ...props.style,
      }}
      {...props}
    >
      <div className="form-body__content-container mx-auto w-full">
        {children}
      </div>
    </div>
  );
};
