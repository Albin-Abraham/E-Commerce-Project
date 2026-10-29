import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";

import { AppPaths } from "@shell/paths";
import { Zenith } from "@shared/theme";

import type { ErrorStateProps } from "./TimeoutErrorState";

export const NotFoundErrorState: React.FC<ErrorStateProps> = ({
  inline = false,
  title,
  message,
  code = "HTTP_404_NOT_FOUND",
  homePath = AppPaths.Root,
}) => {
  const { t } = useTranslation("screens/errors");
  const displayTitle = title ?? t("notFound.title");
  const displayMessage = message ?? t("notFound.description");
  const actionLabel = t("notFound.action");
  if (inline) {
    return (
      <div className="p-6 border border-border/50 bg-muted/20 rounded-xl text-center max-w-xl mx-auto my-4">
        <Compass className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <h4 className="font-bold text-base text-foreground mb-1">{displayTitle}</h4>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {displayMessage}
        </p>
        <div className="flex justify-center">
          <Link
            to={homePath}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded hover:opacity-90 transition-opacity flex items-center gap-1 font-semibold"
          >
            <Home className="w-3.5 h-3.5" /> {actionLabel}
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
          " !p-8 text-center max-w-2xl mx-auto border-border/40"
        }
      >
        <div className="p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border bg-muted/30 text-foreground border-border/40">
          <Compass className="w-8 h-8 text-primary animate-spin-slow" />
        </div>
        <h1 className={Zenith.text("h1") + " mb-2"}>404</h1>
        <h2 className={Zenith.text("h2") + " mb-2"}>{displayTitle}</h2>
        <p className={Zenith.text("body") + " mb-6"}>{displayMessage}</p>
        {code && (
          <code className="text-xs font-mono block px-2 py-1 bg-black/5 dark:bg-white/5 rounded border border-border/20 max-w-md mx-auto mb-6">
            {code}
          </code>
        )}
        <div className="flex justify-center">
          <Link to={homePath} className={Zenith.button("primary")}>
            <Home className="w-4 h-4 mr-2" />
            {actionLabel}
          </Link>
        </div>
      </div>
    </div>
  );
};
