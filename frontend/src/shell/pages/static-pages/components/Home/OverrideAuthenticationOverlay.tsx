import React from "react";

import { Modal } from "@ui/modal";

interface OverrideAuthenticationOverlayProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  clearanceLevel?: string;
  payloadName?: string;
  onConfirm?: () => void;
}

/**
 * OverrideAuthenticationOverlay Component
 *
 * A premium, context-driven security clearance modal.
 * Built using the newly engineered ZenOS V2 Composite Modal system.
 */
export const OverrideAuthenticationOverlay: React.FC<
  OverrideAuthenticationOverlayProps
> = ({
  isOpen,
  onOpenChange,
  clearanceLevel = "OMEGA_TIER",
  payloadName = "init_sequence_0.exe",
  onConfirm,
}) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Header>System Override Authorization</Modal.Header>

      <Modal.Body>
        <p className="text-muted-foreground mb-4">
          You are attempting to initialize the core infrastructure kernel. This
          action will bypass standard security protocols and grant root-level
          access to the Zenith orchestrator.
        </p>

        {/* Security Clearance Details Card */}
        <div className="mt-6 font-mono text-xs p-4 bg-muted/10 rounded-lg border border-border">
          <div className="flex justify-between border-b border-border/50 pb-2 mb-2">
            <span className="text-muted-foreground">Status:</span>
            <span className="text-warning font-bold animate-pulse">
              AWAITING_CONFIRMATION
            </span>
          </div>

          <div className="flex justify-between border-b border-border/50 pb-2 mb-2">
            <span className="text-muted-foreground">Clearance Level:</span>
            <span className="text-primary font-bold">{clearanceLevel}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Target Payload:</span>
            <span className="text-foreground">{payloadName}</span>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer
        actions={[
          {
            label: "Reminder Me Later",
            variant: "ghost",
            onPress: () => {},
          },
          {
            label: "Ignore",
            variant: "outline",
            onPress: () => {},
          },
          {
            label: "Confirm Execution",
            variant: "primary",
            onPress: onConfirm,
          },
        ]}
      />
    </Modal>
  );
};
