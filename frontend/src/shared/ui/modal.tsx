import React, { createContext, useContext } from "react";
import {
  Modal as AriaModal,
  Button,
  Dialog,
  Heading,
  ModalOverlay,
  type ModalOverlayProps,
} from "react-aria-components";

import { Box } from "@ui/layout/Box";
import { Flex } from "@ui/layout/Flex";
import { X } from "lucide-react";

import { Zenith } from "@shared/theme";

// 1. Create a Modal Context to share closing mechanics
interface ModalContextProps {
  close: () => void;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error(
      "Modal sub-components must be rendered within a <Modal> container."
    );
  }
  return context;
};

// Standard width layout size mapping for elite aesthetics
const SIZE_MAP = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
  full: "max-w-[calc(100vw-2rem)] md:max-w-[calc(100vw-4rem)]",
};

interface ModalProps extends ModalOverlayProps {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  children: React.ReactNode;
}

export function Modal({
  isOpen,
  onOpenChange,
  size = "md",
  className,
  isDismissable = false,
  children,
  ...props
}: ModalProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      className={({ isEntering, isExiting }) =>
        Zenith.cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6",
          isEntering ? "animate-in fade-in duration-300" : "",
          isExiting ? "animate-out fade-out duration-200" : ""
        )
      }
      {...props}
    >
      <AriaModal
        className={({ isEntering, isExiting }) =>
          Zenith.cn(
            "bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl md:rounded-3xl w-full max-h-[90vh] flex flex-col overflow-hidden relative",
            SIZE_MAP[size],
            isEntering ? "animate-in zoom-in-95 fade-in duration-300" : "",
            isExiting ? "animate-out zoom-out-95 fade-out duration-200" : "",
            className
          )
        }
      >
        <Dialog className="outline-none relative w-full flex-1 flex flex-col overflow-hidden">
          {({ close }) => (
            <ModalContext.Provider value={{ close }}>
              {children}
            </ModalContext.Provider>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}

// 2. Composite Header Sub-Component
interface ModalHeaderProps {
  children: React.ReactNode;
  showIndicator?: boolean;
  className?: string;
}

function ModalHeader({
  children,
  showIndicator = true,
  className,
}: ModalHeaderProps) {
  const { close } = useModalContext();

  return (
    <Flex
      align="center"
      justify="between"
      className={Zenith.cn(
        "flex-shrink-0 p-6 border-b border-border/50 bg-background/50 sticky top-0 z-10",
        className
      )}
    >
      <Flex align="center" gap="md">
        {showIndicator && (
          <Flex
            align="center"
            justify="center"
            className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 shrink-0"
          >
            <Box className="w-3 h-3 bg-primary rounded-full shadow-neon-primary animate-pulse" />
          </Flex>
        )}
        <Heading
          slot="title"
          className={
            Zenith.text("h2") + " !text-2xl m-0 tracking-tighter truncate"
          }
        >
          {children}
        </Heading>
      </Flex>

      <Button
        onPress={close}
        className="shrink-0 p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors outline-none focus-visible:ring-2 ring-primary"
        aria-label="Close modal"
      >
        <X size={20} />
      </Button>
    </Flex>
  );
}

// 3. Composite Body Sub-Component
interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <Box
      className={Zenith.cn(
        "flex-1 overflow-y-auto p-6 text-muted-foreground text-base leading-relaxed scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
        className
      )}
    >
      {children}
    </Box>
  );
}

// 4. Composite Footer Sub-Component
export interface ModalAction {
  label: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  className?: string;
}

interface ModalFooterProps {
  children?: React.ReactNode;
  align?: "left" | "center" | "right" | "between";
  className?: string;
  actions?: ModalAction[];
}

const ALIGN_MAP = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
  between: "justify-between",
};

function ModalFooter({
  children,
  align = "right",
  className,
  actions,
}: ModalFooterProps) {
  return (
    <Flex
      align="center"
      gap="sm"
      className={Zenith.cn(
        "flex-shrink-0 p-6 border-t border-border/50 bg-background/50 sticky bottom-0 z-10",
        ALIGN_MAP[align],
        className
      )}
    >
      {actions
        ? actions.map((action, i) => (
            <ModalCloseButton
              key={i}
              variant={action.variant}
              className={action.className}
              onPress={action.onPress}
            >
              {action.label}
            </ModalCloseButton>
          ))
        : children}
    </Flex>
  );
}

// 5. Composite Context-Aware Close Button
interface ModalCloseButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  className?: string;
  onPress?: () => void;
}

function ModalCloseButton({
  children,
  variant = "ghost",
  className,
  onPress,
}: ModalCloseButtonProps) {
  const { close } = useModalContext();

  const handlePress = () => {
    if (onPress) onPress();
    close();
  };

  return (
    <Button
      onPress={handlePress}
      className={Zenith.cn(Zenith.button(variant), className)}
    >
      {children}
    </Button>
  );
}

// Assign Sub-components to parent Modal Namespace
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Close = ModalCloseButton;
