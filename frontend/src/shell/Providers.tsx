import React from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@ui/common/ErrorBoundary";
import { LazyMotion, domAnimation } from "framer-motion";

import { GlobalEventProvider } from "@/core/events/GlobalEventProvider";
import { queryClient } from "@/core/providers/queryClient";

import { HttpProvider } from "@contexts/HttpContext";
import { ThemeProvider } from "@contexts/themeProvider";

import { AlertDialogProvider } from "@shared/ui/AlertDialog";
import { ToastContainer } from "@shared/ui/Toast";
import { DebugProvider } from "@core/debug";

import { composeProviders } from "@/shared/utils/composeProviders";

const AppProviders = composeProviders([
  React.StrictMode,
  ErrorBoundary,
  [QueryClientProvider, { client: queryClient }],
  ThemeProvider,
  HttpProvider,
  GlobalEventProvider,
  [LazyMotion, { features: domAnimation, strict: true }],
  AlertDialogProvider,
  DebugProvider,
]);

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <AppProviders>
      {children}
      <ToastContainer />
    </AppProviders>
  );
};
