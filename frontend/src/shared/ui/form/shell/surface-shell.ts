import type { ComponentType, ReactNode } from "react";

export interface FormSurfaceShellProps {
  header?: ReactNode;
  body: ReactNode;
  footer?: ReactNode;
}

export type FormSurfaceShell = ComponentType<FormSurfaceShellProps>;
