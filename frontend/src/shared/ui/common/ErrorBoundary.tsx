import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Specifically useful for catching 'ChunkLoadError' when lazy loading scripts fails,
 * but also catches any other rendering errors in the subtree.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  private isChunkError(error: Error | null): boolean {
    if (!error) return false;
    const msg = error.message ?? "";
    return (
      error.name === "ChunkLoadError" ||
      msg.includes("dynamically imported module") ||
      msg.includes("Failed to fetch") ||
      msg.includes("error loading") ||
      msg.includes("ChunkLoadError")
    );
  }

  private handleReset = () => {
    const wasChunkError = this.isChunkError(this.state.error);
    this.setState({ hasError: false, error: null });
    if (wasChunkError) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunk = this.isChunkError(this.state.error);

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-card rounded-lg border border-border shadow-sm">
          <div className="w-16 h-16 mb-4 text-destructive">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {isChunk ? "Failed to load" : "Something went wrong"}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {isChunk
              ? "A new version was deployed or the network failed. Reload to get the latest code."
              : this.state.error?.message ||
                "An unexpected error occurred while loading this view."}
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium"
          >
            {isChunk ? "Reload Page" : "Try Again"}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
