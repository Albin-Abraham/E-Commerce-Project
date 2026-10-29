import React from "react";
import { Link } from "react-router-dom";
import { Home, ShieldAlert } from "lucide-react";

import { AppPaths } from "@shell/paths";
import { Zenith } from "@shared/theme";

import type { ErrorStateProps } from "./TimeoutErrorState";

export const ForbiddenErrorState: React.FC<ErrorStateProps> = ({
  inline = false,
  title = "Access Denied",
  message = "You do not have the required permissions or role clearances to view this resource.",
  code = "HTTP_403_FORBIDDEN",
  homePath = AppPaths.Root,
}) => {
  if (inline) {
    return (
      <div className="p-6 border border-rose-500/20 bg-rose-500/5 rounded-xl text-center max-w-xl mx-auto my-4 text-rose-500">
        <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h4 className="font-bold text-base mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-center">
          <Link
            to={homePath}
            className="px-3 py-1.5 border border-border text-xs rounded hover:bg-muted transition-colors flex items-center gap-1 font-semibold text-foreground"
          >
            <Home className="w-3.5 h-3.5" /> Return to Core
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
          " !p-8 text-center max-w-2xl mx-auto border-rose-500/30"
        }
      >
        <div className="p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border bg-rose-500/10 text-rose-500 border-rose-500/20">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className={Zenith.text("h2") + " text-rose-500 mb-2"}>
          {title}
        </h2>
        <p className={Zenith.text("body") + " mb-6"}>{message}</p>
        {code && (
          <code className="text-xs font-mono block px-2 py-1 bg-black/5 dark:bg-white/5 rounded border border-border/20 max-w-md mx-auto mb-6">
            {code}
          </code>
        )}
        <div className="flex justify-center">
          <Link to={homePath} className={Zenith.button("primary")}>
            <Home className="w-4 h-4 mr-2" />
            Core Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
