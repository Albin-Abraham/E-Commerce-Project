import {
  AlertTriangle,
  CheckCircle,
  Info,
  type LucideIcon,
  XCircle,
} from "lucide-react";

import type { DialogIntent } from "./types";

export interface IntentConfig {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  confirmBg: string;
  confirmHover: string;
}

export const INTENT_CONFIG: Record<DialogIntent, IntentConfig> = {
  success: {
    icon: CheckCircle,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    confirmBg: "bg-success",
    confirmHover: "hover:bg-success/90",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    confirmBg: "bg-warning",
    confirmHover: "hover:bg-warning/90",
  },
  error: {
    icon: XCircle,
    iconBg: "bg-danger/10",
    iconColor: "text-danger",
    confirmBg: "bg-danger",
    confirmHover: "hover:bg-danger/90",
  },
  info: {
    icon: Info,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    confirmBg: "bg-primary",
    confirmHover: "hover:bg-primary/90",
  },
  danger: {
    icon: AlertTriangle,
    iconBg: "bg-danger/10",
    iconColor: "text-danger",
    confirmBg: "bg-danger",
    confirmHover: "hover:bg-danger/90",
  },
};

export const DEFAULT_CONFIRM_LABELS: Record<DialogIntent, string> = {
  success: "OK",
  warning: "Continue",
  error: "Retry",
  info: "Got it",
  danger: "Delete",
};
