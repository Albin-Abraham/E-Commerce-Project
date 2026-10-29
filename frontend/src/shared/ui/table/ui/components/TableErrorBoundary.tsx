import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

/**
 * TableErrorBoundary
 *
 * Catches rendering errors in table children and displays a fallback UI
 * instead of crashing the entire table. Logs the error for debugging.
 */

export interface TableErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI when an error occurs */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Table ID for logging context */
  tableId?: string;
}

interface TableErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class TableErrorBoundary extends Component<
  TableErrorBoundaryProps,
  TableErrorBoundaryState
> {
  constructor(props: TableErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): TableErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, tableId } = this.props;
    if (onError) {
      onError(error, errorInfo);
    } else {
      console.error(
        `[ZenithTable${tableId ? `:${tableId}` : ""}] Rendering error:`,
        error,
        errorInfo.componentStack
      );
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, tableId } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.reset);
      }

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 p-8 text-center border border-destructive/20 rounded-lg bg-destructive/5"
          data-testid={tableId ? `table-error-${tableId}` : "table-error"}
        >
          <div className="text-destructive font-semibold">
            Something went wrong
          </div>
          <div className="text-sm text-muted-foreground max-w-md">
            {error.message ||
              "An unexpected error occurred while rendering the table."}
          </div>
          <button
            onClick={this.reset}
            className="px-4 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return children;
  }
}
