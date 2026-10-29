import React, { useId } from "react";
import {
  Button,
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { createPortal } from "react-dom";

import { Zenith } from "@shared/theme";

import { cn } from "@libs/utils";

import { DEFAULT_CONFIRM_LABELS, INTENT_CONFIG } from "./intent-config";
import type { DialogIntent } from "./types";

interface AlertDialogRootProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  intent?: DialogIntent;
  title: React.ReactNode;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  className?: string;
}

function AlertDialogRoot({
  isOpen,
  onOpenChange,
  intent = "info",
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  className,
}: AlertDialogRootProps) {
  const config = INTENT_CONFIG[intent];
  const Icon = config.icon;
  const resolvedConfirmLabel = confirmLabel || DEFAULT_CONFIRM_LABELS[intent];
  const titleId = useId();
  const messageId = useId();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      className={({ isEntering, isExiting }) =>
        Zenith.cn(
          "fixed inset-0 z-[500] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4",
          isEntering ? "animate-in fade-in duration-300" : "",
          isExiting ? "animate-out fade-out duration-200" : ""
        )
      }
    >
      <Modal
        className={({ isEntering, isExiting }) =>
          Zenith.cn(
            "bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl w-full max-w-md flex flex-col overflow-hidden relative",
            isEntering ? "animate-in zoom-in-95 fade-in duration-300" : "",
            isExiting ? "animate-out zoom-out-95 fade-out duration-200" : "",
            className
          )
        }
      >
        <Dialog
          className="outline-none relative w-full"
          aria-labelledby={titleId}
          aria-describedby={messageId}
        >
          {() => (
            <div className="p-6 flex flex-col items-center text-center">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-4",
                  config.iconBg
                )}
              >
                <Icon className={cn("w-6 h-6", config.iconColor)} />
              </div>

              <Heading
                id={titleId}
                slot="title"
                className="text-lg font-bold text-foreground mb-2"
              >
                {title}
              </Heading>

              <p
                id={messageId}
                className="text-sm text-muted-foreground mb-6 max-w-sm"
              >
                {message}
              </p>

              <div className="flex items-center gap-3 w-full">
                <Button
                  onPress={handleCancel}
                  className={Zenith.cn(
                    "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg",
                    "bg-transparent text-foreground border border-border",
                    "hover:bg-muted transition-colors",
                    "outline-none focus-visible:ring-2 ring-primary/40"
                  )}
                >
                  {cancelLabel}
                </Button>

                <Button
                  onPress={handleConfirm}
                  className={Zenith.cn(
                    "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg text-white",
                    config.confirmBg,
                    config.confirmHover,
                    "transition-colors shadow-md",
                    "outline-none focus-visible:ring-2 ring-primary/40"
                  )}
                >
                  {resolvedConfirmLabel}
                </Button>
              </div>
            </div>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>,
    document.body
  );
}

export { AlertDialogRoot };
export type { AlertDialogRootProps };
