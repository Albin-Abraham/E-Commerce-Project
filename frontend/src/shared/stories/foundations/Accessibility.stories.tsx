import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  SkipLink,
  LiveAnnouncer,
  announce,
} from "../../ui/a11y";
import { FieldShell } from "../../ui/form/structure/FieldShell";
import { TextField } from "../../ui/form/fields/primitive/TextField";
import { CheckboxField } from "../../ui/form/fields/primitive/CheckboxField";
import { SwitchField } from "../../ui/form/fields/primitive/SwitchField";
import { Button } from "../../ui/button";

const meta: Meta = {
  title: "Foundations/Accessibility",
  parameters: {
    docs: {
      description: {
        component:
          "Foundational accessibility primitives, live regions, focus rings, and multi-ID ARIA form coordination.",
      },
    },
  },
};

export default meta;

export const SkipToContentDemo: StoryObj = {
  name: "01. Skip Link",
  render: () => (
    <div className="relative p-6 border border-border rounded-xl bg-card space-y-4">
      <p className="text-sm text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs font-mono">Tab</kbd> to reveal the Skip Link button in the top left corner:
      </p>
      <SkipLink targetId="target-content" />
      <div id="target-content" tabIndex={-1} className="p-4 bg-muted/40 rounded-lg">
        <h3 className="font-semibold text-foreground">Main Content Target</h3>
        <p className="text-sm text-muted-foreground">
          Bypassed repetitive header navigation directly to this landmark.
        </p>
      </div>
    </div>
  ),
};

export const LiveAnnouncements: StoryObj = {
  name: "02. Live Regions & Announcements",
  render: () => {
    const [history, setHistory] = useState<string[]>([]);

    const handlePolite = () => {
      const msg = `Table data sorted by Name at ${new Date().toLocaleTimeString()}`;
      announce(msg, "polite");
      setHistory((prev) => [msg, ...prev]);
    };

    const handleAssertive = () => {
      const msg = `Critical alert: Session will expire in 2 minutes! (${new Date().toLocaleTimeString()})`;
      announce(msg, "assertive");
      setHistory((prev) => [msg, ...prev]);
    };

    return (
      <div className="p-6 border border-border rounded-xl bg-card space-y-6 max-w-xl">
        <LiveAnnouncer />
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Screen Reader Live Announcer
          </h3>
          <p className="text-sm text-muted-foreground">
            Trigger ARIA live region updates for non-visual assistive technology.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handlePolite}>
            Announce Polite Update
          </Button>
          <Button variant="danger" onClick={handleAssertive}>
            Announce Assertive Alert
          </Button>
        </div>

        <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Announcement History (Synthesized for Screen Readers)
          </h4>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No announcements sent yet.</p>
          ) : (
            <ul className="space-y-1 text-xs font-mono text-foreground">
              {history.map((h, i) => (
                <li key={i}>• {h}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  },
};

export const MultiIdFormShellCoordination: StoryObj = {
  name: "03. Multi-ID ARIA Form Coordination",
  render: () => {
    const [hasError, setHasError] = useState(true);

    return (
      <div className="p-6 border border-border rounded-xl bg-card space-y-6 max-w-md">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-foreground">Accessible Form Field</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setHasError((prev) => !prev)}
          >
            Toggle Validation State
          </Button>
        </div>

        <FieldShell
          id="billing-email"
          name="billingEmail"
          type="text"
          label="Billing Email"
          required
          tooltip="Invoices will be automatically sent to this address each month."
          description="Must be an active corporate email address."
          error={hasError ? "Please enter a valid company email address." : undefined}
        >
          <TextField id="billing-email" name="billingEmail" placeholder="finance@company.com" />
        </FieldShell>

        <FieldShell
          id="auto-renew"
          name="autoRenew"
          type="switch"
          label="Auto-Renewal"
          description="Automatically renew subscription every 12 months"
        >
          <SwitchField id="auto-renew" name="autoRenew" value={true} />
        </FieldShell>

        <FieldShell
          id="accept-terms"
          name="acceptTerms"
          type="checkbox"
          label="Terms of Service"
          required
          error={hasError ? "You must agree to continue" : undefined}
        >
          <CheckboxField id="accept-terms" name="acceptTerms" label="I agree to terms" />
        </FieldShell>
      </div>
    );
  },
};

export const FocusRingGuarantees: StoryObj = {
  name: "04. Focus Rings & Contrast",
  render: () => (
    <div className="p-6 border border-border rounded-xl bg-card space-y-6 max-w-xl">
      <div>
        <h3 className="font-semibold text-foreground">High-Contrast Focus Ring Contract</h3>
        <p className="text-sm text-muted-foreground">
          Tab through the controls below to inspect 3:1 contrast focus rings with 2px offset:
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="danger">Danger Action</Button>
        <Button variant="ghost">Ghost Button</Button>
        <a
          href="#test"
          className="text-sm text-primary underline underline-offset-4 rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Accessible Anchor Link
        </a>
      </div>
    </div>
  ),
};
