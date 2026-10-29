import { useFormTheme } from "@ui/form/context/FormThemeContext";
import { cn } from "@ui/form/utils/form-styles";

import type { TranslatedText } from "../../types";

/**
 * Props for the identity field atoms.
 *
 * These previously imported a `FieldComponent` type from `../registry`, but that
 * module is a 1-line stub and never exported it (nor does anything import these
 * two components). Typed against the shape they actually destructure.
 */
interface IdentityFieldProps {
  field?: {
    type?: string;
    label?: string | TranslatedText;
  };
  className?: string;
}

/**
 * FormDivider: Semantic "OR" separator for authentication flows.
 */
export const FormDivider: React.FC<IdentityFieldProps> = ({
  field,
  className,
}) => {
  const theme = useFormTheme();
  const isCompact = theme.density === "compact";
  const label =
    typeof field?.label === "string" ? field.label : field?.label?.en;

  if (!label && field?.type !== "divider-label") {
    return (
      <hr className={cn("my-6 w-full border-t border-border/60", className)} />
    );
  }

  return (
    <div
      className={cn(
        "relative w-full flex items-center justify-center gap-4",
        isCompact ? "py-2" : "py-4",
        className
      )}
    >
      <div className="flex-grow border-t border-border/60" />
      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/50 whitespace-nowrap">
        {label || "OR"}
      </span>
      <div className="flex-grow border-t border-border/60" />
    </div>
  );
};

/**
 * SocialAuthButtons: Integrated social authentication adapters.
 */
export const SocialAuthButtons: React.FC<IdentityFieldProps> = ({ className }) => {
  const theme = useFormTheme();
  const isCompact = theme.density === "compact";

  return (
    <div className={cn("grid grid-cols-2 gap-4 w-full", className)}>
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-center gap-3 rounded-[var(--radius-md)] bg-background px-4 text-xs font-bold text-foreground border-2 border-border shadow-sm",
          isCompact ? "py-2" : "py-3",
          "hover:bg-subtle hover:border-primary/40 transition-all duration-300 transform active:scale-[0.98]"
        )}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span>Google</span>
      </button>
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-center gap-3 rounded-[var(--radius-md)] bg-background px-4 text-xs font-bold text-foreground border-2 border-border shadow-sm",
          isCompact ? "py-2" : "py-3",
          "hover:bg-subtle hover:border-primary/40 transition-all duration-300 transform active:scale-[0.98]"
        )}
      >
        <svg className="h-5 w-5 fill-[#1877F2]" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span>Facebook</span>
      </button>
    </div>
  );
};
