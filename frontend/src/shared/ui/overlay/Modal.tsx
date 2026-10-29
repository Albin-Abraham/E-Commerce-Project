import React, { createContext, useContext, useEffect } from "react";

import { useEventRegistry } from "@core/events/stores/eventRegistry.store";
import { Box } from "@ui/layout/Box";
import { Flex } from "@ui/layout/Flex";
import { X } from "lucide-react";

import { Zenith } from "@shared/theme";

import { OverlayNav } from "./OverlayNav";

/**
 * Overlay context shares dismiss with Header / Close.
 * The host (ModalProvider headless dialog) still owns portal, backdrop, and size.
 * This compound owns the chrome inside that frame: Header, Body, Footer.
 */
interface OverlayContextValue {
  close?: () => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useModal() {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error("Modal sub-components must be rendered within <Modal>.");
  }
  return context;
}

export interface ModalProps {
  id?: string;
  scope?: string;
  children: React.ReactNode;
  close?: () => void;
  className?: string;
}

function ModalRoot({ id, scope, children, close, className }: ModalProps) {
  const modalScope = scope || (id ? `overlay:${id}` : "overlay:modal");

  useEffect(() => {
    const previousScope = useEventRegistry.getState().activeScope;
    useEventRegistry.getState().setActiveScope(modalScope);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && close) {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (useEventRegistry.getState().activeScope === modalScope) {
        useEventRegistry.getState().setActiveScope(previousScope);
      }
    };
  }, [modalScope, close]);

  return (
    <OverlayContext.Provider value={{ close }}>
      <Flex
        direction="col"
        fill
        data-overlay
        data-testid={id ? `modal-${id}` : "modal-overlay"}
        className={Zenith.cn("overflow-hidden", className)}
      >
        {children}
      </Flex>
    </OverlayContext.Provider>
  );
}


export interface ModalHeaderProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  hideClose?: boolean;
  requiredHint?: boolean;
  className?: string;
}

function ModalHeader({
  title,
  description,
  children,
  hideClose = false,
  requiredHint = false,
  className,
}: ModalHeaderProps) {
  const { close } = useModal();

  return (
    <Flex asChild align="start" justify="between" gap="md">
      <header
        data-overlay-header
        className={Zenith.cn(
          "shrink-0 px-6 pt-5 pb-4 border-b border-black/[0.06]",
          "bg-gradient-to-b from-white to-slate-50/80",
          className
        )}
      >
        <Flex align="stretch" gap="sm" className="min-w-0">
          <Box
            aria-hidden
            className="w-[3px] rounded-full bg-[var(--module-primary,var(--color-primary))] shrink-0"
          />
          <Box className="min-w-0">
            {title ? (
              <h2 className="m-0 text-[1.25rem] font-bold leading-tight tracking-tight text-slate-900">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="m-0 mt-1 text-[0.8125rem] font-normal leading-snug text-slate-500">
                {description}
              </p>
            ) : null}
            {requiredHint ? (
              <p className="m-0 mt-2 text-[0.75rem] text-slate-400">
                <span className="text-danger font-semibold" aria-hidden>
                  Required
                </span>
              </p>
            ) : null}
            {children}
          </Box>
        </Flex>
        {!hideClose && close ? <ModalClose aria-label="Close" /> : null}
      </header>
    </Flex>
  );
}

export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <Box
      data-overlay-body
      className={Zenith.cn(
        "flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-4 pb-10",
        "scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent",
        className
      )}
    >
      {children}
    </Box>
  );
}

const FOOTER_ALIGN = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
  between: "justify-between",
} as const;

export interface ModalFooterProps {
  children?: React.ReactNode;
  align?: keyof typeof FOOTER_ALIGN;
  className?: string;
}

function ModalFooter({
  children,
  align = "right",
  className,
}: ModalFooterProps) {
  return (
    <Flex asChild align="center" gap="sm">
      <footer
        data-overlay-footer
        className={Zenith.cn(
          "shrink-0 px-6 py-3 z-10",
          "bg-slate-50 border-t border-slate-200",
          FOOTER_ALIGN[align],
          className
        )}
      >
        {children}
      </footer>
    </Flex>
  );
}

export interface ModalCloseProps {
  children?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
  onPress?: () => void;
}

function ModalClose({
  children,
  className,
  onPress,
  "aria-label": ariaLabel = "Close",
}: ModalCloseProps) {
  const { close } = useModal();

  const handleClick = () => {
    onPress?.();
    close?.();
  };

  if (children) {
    return (
      <button type="button" className={className} onClick={handleClick}>
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      className={Zenith.cn(
        "shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full",
        "text-slate-400 bg-slate-50 border border-transparent",
        "transition-all duration-200 ease-out",
        "hover:bg-slate-100 hover:text-slate-900 hover:rotate-90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--module-primary,var(--color-primary))]/40",
        className
      )}
    >
      <X size={16} strokeWidth={2.25} />
    </button>
  );
}

type ModalCompound = typeof ModalRoot & {
  Header: typeof ModalHeader;
  Nav: typeof OverlayNav;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
  Close: typeof ModalClose;
};

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Nav: OverlayNav,
  Body: ModalBody,
  Footer: ModalFooter,
  Close: ModalClose,
}) as ModalCompound;

export const Overlay = Modal;
