import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import { AppPaths } from "@shell/paths";
import { Zenith } from "@shared/theme";

import type { ErrorStateProps } from "./TimeoutErrorState";

export const ServerErrorState: React.FC<ErrorStateProps> = ({
  inline = false,
  title = "Component Logic Interrupted",
  message = "A runtime exception occurred in this module. The error has been logged for diagnosis.",
  code = "SEC_ERR_500",
  onRetry = () => window.location.reload(),
  homePath = AppPaths.Root,
}) => {
  if (inline) {
    return (
      <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-xl text-center max-w-xl mx-auto my-4">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
        <h4 className="font-bold text-base text-destructive mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-center gap-2">
          <button
            onClick={onRetry}
            className="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs rounded hover:bg-destructive/90 transition-colors flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Module
          </button>
          <Link
            to={homePath}
            className="px-3 py-1.5 border border-border text-xs rounded hover:bg-muted transition-colors flex items-center gap-1 font-semibold text-foreground"
          >
            <Home className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={Zenith.layout.flexCenter + " h-full min-h-[400px]"}>
      <div
        className={
          Zenith.card({ variant: "glass" }).className +
          " !p-8 text-center max-w-2xl mx-auto border-destructive/20"
        }
      >
        <div className="p-4 rounded-full bg-destructive/10 w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-destructive/20">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className={Zenith.text("h2") + " text-destructive mb-2"}>
          {title}
        </h2>
        <p className={Zenith.text("body") + " mb-6"}>{message}</p>
        {code && (
          <code className="text-xs font-mono block px-2 py-1 bg-black/5 dark:bg-white/5 rounded border border-border/20 max-w-md mx-auto mb-6">
            {code}
          </code>
        )}
        <div className="flex justify-center gap-4">
          <button onClick={onRetry} className={Zenith.button("primary")}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Module
          </button>
          <Link to={homePath} className={Zenith.button("outline")}>
            <Home className="w-4 h-4 mr-2" />
            Core Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
