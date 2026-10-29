import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

import { AppPaths } from "@shell/paths";
import { AnimatePresence, m } from "framer-motion";
import {
  AlertOctagon,
  ChevronDown,
  Copy,
  Home,
  RefreshCcw,
  ShieldAlert,
  Terminal,
  WifiOff,
} from "lucide-react";

import { Zenith } from "@shared/theme";

/**
 * Zenith Industrial Error Orchestrator (Platform Grade)
 *
 * Supports Portal Injection into dedicated #error DOM nodes
 * for mission-critical failure isolation.
 */
export const ZenithErrorElement: React.FC = () => {
  const error = useRouteError();
  const [showTrace, setShowTrace] = useState(false);

  // Effect to handle Shell Suppression when a portal is used
  useEffect(() => {
    const errorContainer = document.getElementById("error");

    if (errorContainer) {
      errorContainer.classList.remove("zenith-error-hidden");
      errorContainer.classList.add("zenith-error-visible");
    }

    return () => {
      if (errorContainer) {
        errorContainer.classList.add("zenith-error-hidden");
        errorContainer.classList.remove("zenith-error-visible");
      }
    };
  }, []);

  let title = "System Exception";
  let message =
    "The Zenith kernel encountered an unhandled execution logic error.";
  let Icon = AlertOctagon;
  let type: "network" | "crash" | "sync" = "crash";
  let code: string | number = "KERN_ERR_500";
  let stack: string | undefined = undefined;

  if (isRouteErrorResponse(error)) {
    type = "sync";
    Icon = ShieldAlert;
    title = `${error.status} ${error.statusText}`;
    message =
      typeof error.data === "string"
        ? error.data
        : error.data?.message || "Data synchronization failed.";
    code = `HTTP_${error.status}`;
  } else if (error instanceof Error) {
    stack = error.stack;
    if (
      error.message.toLowerCase().includes("network") ||
      error.message.toLowerCase().includes("fetch")
    ) {
      type = "network";
      Icon = WifiOff;
      title = "Connectivity Interrupted";
      message =
        "Unable to establish a secure link with Zenith Cloud infrastructure.";
      code = "NET_TIMEOUT_ERR";
    } else {
      message = error.message;
      code = error.name || "RUNTIME_EXCEPTION";
    }
  }

  const errorState = Zenith.error(title, message, () =>
    window.location.reload()
  );

  const content = (
    <div
      className={
        Zenith.layout.flexCenter +
        " fixed inset-0 z-[var(--z-system)] p-[var(--space-6)] bg-background/80 backdrop-blur-xl"
      }
    >
      <m.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={
          errorState.containerProps.className +
          " max-w-2xl shadow-2xl relative overflow-hidden border-t-4 " +
          (type === "network" ? "border-t-amber-500" : "border-t-red-500")
        }
      >
        <div className="flex flex-col">
          <div className="flex items-start justify-between mb-8">
            <div className="p-4 rounded-2xl bg-surface shadow-inner border border-border/10">
              <Icon
                className={`w-10 h-10 ${type === "network" ? "text-amber-500" : "text-red-500"}`}
              />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1 block">
                Fault Code
              </span>
              <code className="text-xs font-mono px-2 py-1 bg-black/5 dark:bg-white/5 rounded border border-border/20">
                {code}
              </code>
            </div>
          </div>

          <h3
            className={
              Zenith.text("h1") +
              " mb-2 " +
              (type === "network" ? "text-amber-600" : "text-red-600")
            }
          >
            {title}
          </h3>
          <p className={Zenith.text("body") + " opacity-70 mb-8 max-w-lg"}>
            {message}
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <button
              {...errorState.actionProps}
              className={
                errorState.actionProps?.className +
                " !py-4 flex-1 " +
                (type === "network"
                  ? " !bg-amber-600 hover:!bg-amber-500 shadow-amber-600/20"
                  : "shadow-red-600/20")
              }
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Initialize Recovery
            </button>
            <Link
              to={AppPaths.Root}
              className={Zenith.button("outline") + " !py-4 px-8"}
              onClick={() => (window.location.href = AppPaths.Root)}
            >
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Link>
          </div>

          <div className="border-t border-border/10 pt-4">
            <button
              onClick={() => setShowTrace(!showTrace)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
            >
              <Terminal className="w-3 h-3" />
              Technical Diagnostics
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-300 ${showTrace ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {showTrace && (
                <m.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-4 bg-black/90 rounded-xl font-mono text-[10px] text-emerald-400/80 leading-relaxed relative group">
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          stack || JSON.stringify(error, null, 2)
                        )
                      }
                      className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                      {stack || JSON.stringify(error, null, 2)}
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </m.div>
    </div>
  );

  const errorTarget = document.getElementById("error");
  return errorTarget ? createPortal(content, errorTarget) : content;
};

export default ZenithErrorElement;
