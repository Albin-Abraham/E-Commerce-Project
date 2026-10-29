import React from "react";
import { AlertCircle, FileX } from "lucide-react";
import { cn } from "@ui/form/utils/form-styles";

interface FormSkeletonProps {
  fieldCount?: number;
  columns?: number;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  fieldCount = 4,
  columns = 2,
}) => (
  <div
    className="w-full animate-pulse space-y-6 p-6"
    role="status"
    aria-label="Form loading"
  >
    <div className="h-8 bg-muted/20 rounded-lg w-1/3" />
    <div className="h-4 bg-muted/20 rounded w-2/3" />
    {Array.from({ length: fieldCount }).map((_, i) => (
      <div
        key={i}
        className={cn(
          "space-y-2",
          i % columns === 0 ? "w-3/5" : "w-2/5"
        )}
      >
        <div className="h-3 bg-muted/20 rounded w-1/4" />
        <div className="h-10 bg-muted/20 rounded-lg" />
      </div>
    ))}
    <div className="flex gap-3 pt-4">
      <div className="h-10 bg-muted/20 rounded-lg w-24" />
      <div className="h-10 bg-muted/20 rounded-lg w-24" />
    </div>
    <span className="sr-only">Loading form...</span>
  </div>
);

export const FormErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = "Something went wrong loading this form.", onRetry }) => (
  <div
    className="w-full p-8 flex flex-col items-center justify-center gap-4"
    role="alert"
  >
    <div className="p-3 bg-danger/10 rounded-full text-danger shrink-0">
      <AlertCircle className="w-8 h-8 text-danger" aria-hidden="true" />
    </div>
    <p className="text-sm text-foreground/70 text-center max-w-md">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
      >
        Retry
      </button>
    )}
  </div>
);

export const FormEmptyState: React.FC<{ message?: string }> = ({
  message = "No form data available.",
}) => (
  <div
    className="w-full p-8 flex flex-col items-center justify-center gap-3"
    role="status"
  >
    <div className="p-3 bg-muted/20 rounded-full text-muted-foreground shrink-0">
      <FileX className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
    </div>
    <p className="text-sm text-foreground/50 text-center max-w-md">{message}</p>
  </div>
);
