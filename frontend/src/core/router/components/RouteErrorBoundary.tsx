import React, { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import {
  ForbiddenErrorState,
  NetworkErrorState,
  NotFoundErrorState,
  ServerErrorState,
  TimeoutErrorState,
  classifyError,
} from "@shared/ui/errors";

import type { RouteErrorBoundaryConfig } from "../route.types";

interface RouteErrorBoundaryProps {
  config: RouteErrorBoundaryConfig;
  onRetry?: () => void;
}

export const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({
  config,
  onRetry = () => window.location.reload(),
}) => {
  const error = useRouteError();

  // Trigger optional onError callback
  useEffect(() => {
    if (config.onError && error instanceof Error) {
      config.onError(error, {} as any);
    }
  }, [error, config]);

  // Auto-recovery for chunk load errors during new deployments
  useEffect(() => {
    if (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : "";

      const isChunkError =
        errorMsg.includes("Failed to fetch dynamically imported module") ||
        errorMsg.includes("dynamically imported module") ||
        errorName === "ChunkLoadError" ||
        errorMsg.includes("ChunkLoadError");

      if (isChunkError) {
        console.warn(
          "🚀 [RouteErrorBoundary]: Outdated chunk detected. Performing auto force-reload..."
        );
        window.location.reload();
      }
    }
  }, [error]);

  // If a custom boundary component is provided, use it
  if (config.component) {
    const CustomComponent = config.component;
    return <CustomComponent error={error} />;
  }

  // Handle redirect fallback strategy
  if (config.fallback === "redirect-home") {
    return <div style={{ display: "none" }} />;
  }

  const isInline = config.fallback === "inline";
  const isRouteError = isRouteErrorResponse(error);
  const errorInfo = classifyError(error, isRouteError);

  const sharedProps = {
    inline: isInline,
    title: errorInfo.title,
    message: errorInfo.message,
    code: errorInfo.code,
    onRetry,
  };

  switch (errorInfo.type) {
    case "timeout":
      return <TimeoutErrorState {...sharedProps} />;
    case "network":
      return <NetworkErrorState {...sharedProps} />;
    case "not-found":
      return <NotFoundErrorState {...sharedProps} />;
    case "forbidden":
      return <ForbiddenErrorState {...sharedProps} />;
    case "server":
    default:
      return <ServerErrorState {...sharedProps} />;
  }
};

