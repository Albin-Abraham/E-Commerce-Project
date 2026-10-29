import React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormThemeProvider } from "@ui/form/context/FormThemeContext";

import {
  CardBody,
  CardDescription,
  CardField,
  CardFooter,
  CardHeader,
  CardTitle,
  CardWrapper,
} from "./LayoutFields";

// ─── Decorator ────────────────────────────────────────────────────────────────
const withTheme = (Story: React.ComponentType) => (
  <FormThemeProvider>
    <div className="min-h-screen bg-subtle p-10 max-w-2xl mx-auto">
      <Story />
    </div>
  </FormThemeProvider>
);

// ─── Shared mock input ────────────────────────────────────────────────────────
const MockInput = ({
  label,
  placeholder = "Enter value…",
}: {
  label: string;
  placeholder?: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[var(--text-sm)] font-bold text-foreground/80">
      {label}
    </label>
    <div className="flex items-center px-4 py-2.5 gap-3 bg-[var(--glass-bg)] rounded-[var(--radius-md)] border border-border shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200">
      <input
        className="w-full bg-transparent border-none outline-none text-foreground text-[var(--text-base)] placeholder:text-foreground/30"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const MockFieldGrid = () => (
  <div className="grid grid-cols-12 gap-4">
    <div className="col-span-12 md:col-span-6">
      <MockInput label="First Name" placeholder="e.g. John" />
    </div>
    <div className="col-span-12 md:col-span-6">
      <MockInput label="Last Name" placeholder="e.g. Doe" />
    </div>
    <div className="col-span-12">
      <MockInput label="Email Address" placeholder="john@example.com" />
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
//  1. SLOT PRIMITIVES  (Form/Structure/CardField/WrapperSlots)
//     Shows each primitive in isolation so developers understand the anatomy.
// ═════════════════════════════════════════════════════════════════════════════

const slotsMeta: Meta<typeof CardWrapper> = {
  title: "Form/Structure/CardField",
  component: CardWrapper,
  tags: ["autodocs"],
  decorators: [withTheme],
  parameters: {
    docs: {
      description: {
        component:
          "Individual slot primitives that compose `CardField`. Each can be used standalone or assembled manually for custom layouts.",
      },
    },
  },
};

export default slotsMeta;
type SlotsStory = StoryObj<typeof CardWrapper>;

/** Full manually-assembled card — all slots visible */
export const AllSlots: SlotsStory = {
  render: () => (
    <FormThemeProvider>
      <div className="bg-subtle p-10 max-w-2xl">
        <CardWrapper elevation="md">
          <CardHeader>
            <CardTitle>Patient Registration</CardTitle>
            <CardDescription>
              Enter the primary details for this patient record.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <MockFieldGrid />
          </CardBody>
          <CardFooter>
            <span className="text-[10px] uppercase tracking-widest font-black text-muted">
              All fields are required
            </span>
          </CardFooter>
        </CardWrapper>
      </div>
    </FormThemeProvider>
  ),
};

/** Header-only — title without description */
export const HeaderTitleOnly: SlotsStory = {
  render: () => (
    <FormThemeProvider>
      <div className="bg-subtle p-10 max-w-2xl">
        <CardWrapper elevation="sm">
          <CardHeader>
            <CardTitle>Emergency Contacts</CardTitle>
          </CardHeader>
          <CardBody>
            <MockFieldGrid />
          </CardBody>
        </CardWrapper>
      </div>
    </FormThemeProvider>
  ),
};

/** Body only — no header, no footer */
export const BodyOnly: SlotsStory = {
  render: () => (
    <FormThemeProvider>
      <div className="bg-subtle p-10 max-w-2xl">
        <CardWrapper elevation="sm">
          <CardBody>
            <MockFieldGrid />
          </CardBody>
        </CardWrapper>
      </div>
    </FormThemeProvider>
  ),
};

/** All four elevation levels */
export const ElevationScale: SlotsStory = {
  render: () => (
    <FormThemeProvider>
      <div className="bg-subtle p-10 max-w-2xl space-y-5">
        {(["none", "sm", "md", "lg"] as const).map((e) => (
          <CardWrapper key={e} elevation={e}>
            <CardHeader>
              <CardTitle>Elevation: &quot;{e}&quot;</CardTitle>
              <CardDescription>
                {e === "none"
                  ? "Border only, no shadow"
                  : `shadow-${e} + border-border hover → shadow-lg + border-primary/25`}
              </CardDescription>
            </CardHeader>
            <CardBody>
              <MockInput label="Sample Field" />
            </CardBody>
          </CardWrapper>
        ))}
      </div>
    </FormThemeProvider>
  ),
};

// ═════════════════════════════════════════════════════════════════════════════
//  2. CardField STORIES  (Form/Structure/CardField)
//     Tests the engine-facing assembled component.
// ═════════════════════════════════════════════════════════════════════════════

/** Engine-assembled CardField — default usage */
export const Default: SlotsStory = {
  render: () => (
    <FormThemeProvider>
      <div className="bg-subtle p-10 max-w-2xl">
        <CardField
          field={{
            id: "card-demo",
            name: "card_demo",
            type: "card",
            label: "Personal Information",
            description: "Enter the primary contact details for this record.",
            properties: { elevation: "md" },
          }}
        >
          <MockFieldGrid />
        </CardField>
      </div>
    </FormThemeProvider>
  ),
};

/** Hover does NOT lift card off the page — visual regression test */
export const HoverStaysGrounded: SlotsStory = {
  render: () => (
    <FormThemeProvider>
      <div className="bg-subtle p-10 max-w-2xl space-y-2">
        <p className="text-[var(--text-sm)] text-foreground/60 pb-2">
          Hover the card — it should NOT lift off the page. Border and shadow
          enhance only.
        </p>
        <CardField
          field={{
            id: "hover-test",
            name: "hover",
            type: "card",
            label: "Hover Me",
            description:
              "Should stay in place — border turns primary-tinted, shadow deepens.",
            properties: { elevation: "sm" },
          }}
        >
          <MockInput label="Patient Name" />
        </CardField>
      </div>
    </FormThemeProvider>
  ),
};

/** With footer slot */
export const WithFooter: SlotsStory = {
  render: () => (
    <FormThemeProvider>
      <div className="bg-subtle p-10 max-w-2xl">
        <CardField
          field={{
            id: "card-footer",
            name: "card_footer",
            type: "card",
            label: "Medication History",
            description:
              "Records retained 7 years per regulatory requirements.",
            properties: {
              elevation: "md",
              footer: "Last updated: 10 Apr 2026 at 11:45 AM",
            },
          }}
        >
          <MockFieldGrid />
        </CardField>
      </div>
    </FormThemeProvider>
  ),
};

/** Compact density — smaller padding via useFormTheme() */
export const CompactDensity: SlotsStory = {
  render: () => (
    <FormThemeProvider theme={{ density: "compact" } as any}>
      <div className="bg-subtle p-10 max-w-2xl">
        <CardField
          field={{
            id: "card-compact",
            name: "card_compact",
            type: "card",
            label: "Compact Card (density: compact)",
            description:
              "Header and body padding are reduced via isCompact flag from useFormTheme().",
            properties: { elevation: "sm" },
          }}
        >
          <MockFieldGrid />
        </CardField>
      </div>
    </FormThemeProvider>
  ),
};

/**
 * Nested cards — the critical regression test.
 * Inner cards must NOT break the outer card's border-radius or create
 * z-index / overflow issues. No overflow-hidden on CardWrapper means
 * each card is an independent stacking context.
 */
export const NestedCards: SlotsStory = {
  render: () => (
    <FormThemeProvider>
      <div className="bg-subtle p-10 max-w-3xl">
        <CardField
          field={{
            id: "outer-card",
            name: "outer",
            type: "card",
            label: "Appointment Booking",
            description: "Fill in all sections below to complete the booking.",
            properties: { elevation: "md" },
          }}
        >
          <div className="space-y-4">
            {/* Inner card 1 */}
            <CardField
              field={{
                id: "inner-1",
                name: "inner1",
                type: "card",
                label: "Patient Details",
                properties: { elevation: "sm" },
              }}
            >
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-6">
                  <MockInput label="Patient Name" />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <MockInput label="Date of Birth" placeholder="DD/MM/YYYY" />
                </div>
              </div>
            </CardField>

            {/* Inner card 2 */}
            <CardField
              field={{
                id: "inner-2",
                name: "inner2",
                type: "card",
                label: "Slot Details",
                properties: { elevation: "sm" },
              }}
            >
              <MockInput
                label="Preferred Appointment Date"
                placeholder="DD/MM/YYYY"
              />
            </CardField>
          </div>
        </CardField>
      </div>
    </FormThemeProvider>
  ),
};

/** Dropdown overflow regression — select at bottom of card must NOT be clipped */
export const DropdownNotClipped: SlotsStory = {
  render: () => (
    <FormThemeProvider>
      <div className="bg-subtle p-10 max-w-2xl">
        <p className="text-[var(--text-sm)] text-foreground/60 pb-4">
          The native select below should NOT be clipped by the card. No{" "}
          <code>overflow-hidden</code>
          on CardWrapper means the dropdown can extend beyond the card boundary.
        </p>
        <CardField
          field={{
            id: "clip-test",
            name: "clip",
            type: "card",
            label: "Dropdown Overflow Test",
            description: "Select menu must float freely over the card edge.",
            properties: { elevation: "md" },
          }}
        >
          <div className="space-y-4">
            <MockInput label="Patient ID" />
            <div className="flex flex-col gap-1">
              <label className="text-[var(--text-sm)] font-bold text-foreground/80">
                Department (native select)
              </label>
              <div className="flex items-center px-4 py-2.5 bg-[var(--glass-bg)] rounded-[var(--radius-md)] border border-border">
                <select className="w-full bg-transparent border-none outline-none text-foreground text-[var(--text-base)]">
                  <option>Cardiology</option>
                  <option>Neurology</option>
                  <option>Paediatrics</option>
                  <option>Orthopaedics</option>
                  <option>Radiology</option>
                  <option>Oncology</option>
                </select>
              </div>
            </div>
          </div>
        </CardField>
      </div>
    </FormThemeProvider>
  ),
};
