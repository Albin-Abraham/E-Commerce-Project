import React from "react";
import { Link } from "react-router-dom";
import { ClockAlert, Home, RefreshCw } from "lucide-react";

import { AppPaths } from "@shell/paths";
import { Zenith } from "@shared/theme";

export interface ErrorStateProps {
  inline?: boolean;
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
  homePath?: string;
}

export const TimeoutErrorState: React.FC<ErrorStateProps> = ({
  inline = false,
  title = "Request Timed Out",
  message = "The server took too long to respond. Heavy network load or a delayed background process may be the cause.",
  code = "HTTP_408_TIMEOUT",
  onRetry = () => window.location.reload(),
  homePath = AppPaths.Root,
}) => {
  if (inline) {
    return (
      <div className="p-6 border border-amber-500/20 bg-amber-500/5 rounded-xl text-center max-w-xl mx-auto my-4 text-amber-500">
        <ClockAlert className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-pulse" />
        <h4 className="font-bold text-base mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-center gap-2">
          <button
            onClick={onRetry}
            className="px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1 font-semibold bg-amber-500 text-black hover:bg-amber-400"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
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
          " !p-8 text-center max-w-2xl mx-auto border-amber-500/30"
        }
      >
        <div className="p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border bg-amber-500/10 text-amber-500 border-amber-500/20">
          <ClockAlert className="w-8 h-8 text-amber-500 animate-pulse" />
        </div>
        <h2 className={Zenith.text("h2") + " text-amber-500 mb-2"}>
          {title}
        </h2>
        <p className={Zenith.text("body") + " mb-6"}>{message}</p>
        {code && (
          <code className="text-xs font-mono block px-2 py-1 bg-black/5 dark:bg-white/5 rounded border border-border/20 max-w-md mx-auto mb-6">
            {code}
          </code>
        )}
        <div className="flex justify-center gap-4">
          <button
            onClick={onRetry}
            className="px-4 py-2.5 rounded-lg bg-amber-500 text-black font-semibold text-sm flex items-center gap-2 hover:bg-amber-400 transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
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
