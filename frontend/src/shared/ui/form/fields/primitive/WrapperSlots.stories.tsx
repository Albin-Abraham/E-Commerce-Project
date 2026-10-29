import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FormField } from "@ui/form/fields";
import { InputWrapper } from "@ui/form/structure/InputWrapper";
import { OuterWrapper } from "@ui/form/structure/OuterWrapper";
import { FieldLabel } from "@ui/form/structure/FieldLabel";
import { Info, Mail, User, ShieldCheck, Sparkles } from "lucide-react";

const meta: Meta = {
  title: "Form/Structure/WrapperSlots",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj;

/**
 * Canonical Floating Label using InputWrapper native notch engine
 */
export const CanonicalFloatingLabel: Story = {
  render: () => {
    const [val, setVal] = useState("");
    const field: FormField = {
      id: "canonical-floating-demo",
      name: "fullName",
      type: "text",
      label: "Full Legal Name",
      properties: {
        labelPlacement: "inline-floating",
      },
    } as any;

    return (
      <div className="w-[380px] p-6 rounded-2xl bg-surface border border-border shadow-lg">
        <InputWrapper
          field={field}
          label={<FieldLabel field={field} styles={{}} />}
          labelPlacement="inline-floating"
          hasValue={Boolean(val)}
        >
          <OuterWrapper
            field={field}
            startContent={<User size={16} className="text-foreground/40 ml-1 mr-2" />}
          >
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full bg-transparent border-none outline-none ring-0 text-sm py-1.5 text-foreground"
              placeholder=""
            />
          </OuterWrapper>
        </InputWrapper>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Type above or focus input to see the native notch scaling in action.
        </p>
      </div>
    );
  },
};

/**
 * Dynamic Slots Trinity: beforeField, startContent, endContent, afterField
 */
export const DynamicSlotsTrinity: Story = {
  render: () => {
    const [val, setVal] = useState("enterprise-tier");
    const field: FormField = {
      id: "slots-trinity-demo",
      name: "subscription",
      type: "text",
      label: "Subscription Plan Tier",
      properties: {
        slots: {
          beforeField: (
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mb-1">
              <Sparkles size={14} /> Recommended for Teams
            </div>
          ),
          startContent: <Mail size={16} className="text-foreground/40 mr-2 ml-1" />,
          endContent: (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 mr-1">
              Active
            </span>
          ),
          afterField: (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
              <ShieldCheck size={13} className="text-emerald-500" /> Enterprise SLA 99.99% Guaranteed
            </div>
          ),
        },
      },
    } as any;

    return (
      <div className="w-[420px] p-6 rounded-2xl bg-surface border border-border shadow-lg">
        <InputWrapper
          field={field}
          label={<FieldLabel field={field} styles={{}} />}
          labelPlacement="top"
        >
          <OuterWrapper field={field}>
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full bg-transparent border-none outline-none ring-0 text-sm py-1.5 text-foreground"
            />
          </OuterWrapper>
        </InputWrapper>
      </div>
    );
  },
};

/**
 * In-Surface Tooltip Slot via OuterWrapper
 */
export const InSurfaceTooltipSlot: Story = {
  render: () => {
    const field: FormField = {
      id: "in-surface-tooltip",
      name: "routingKey",
      type: "text",
      label: "Gateway Routing Key",
      properties: {
        slots: {
          startContent: <User size={16} className="text-foreground/40 mr-2 ml-1" />,
          endContent: (
            <div className="group relative mr-1">
              <Info size={16} className="text-primary cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-52 p-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-xl border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                Injected via OuterWrapper slot! Validates ingress network packets.
              </div>
            </div>
          ),
        },
      },
    } as any;

    return (
      <div className="w-[380px] p-6 rounded-2xl bg-surface border border-border shadow-lg">
        <InputWrapper
          field={field}
          label={<FieldLabel field={field} styles={{}} />}
          labelPlacement="top"
        >
          <OuterWrapper field={field}>
            <input
              defaultValue="rt_live_gateway_01"
              className="w-full bg-transparent border-none outline-none ring-0 text-sm py-1.5 text-foreground"
            />
          </OuterWrapper>
        </InputWrapper>
      </div>
    );
  },
};
