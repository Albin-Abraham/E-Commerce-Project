import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { withAtom } from "@ui/form/hoc/withAtom";
import { TextField } from "@ui/form/fields/primitive/TextField";
import { FileField } from "@ui/form/fields/primitive/FileField";
import { RangeField } from "@ui/form/fields/primitive/RangeField";
import { AutocompleteField } from "@ui/form/fields/primitive/AutocompleteField";
import { SelectField } from "@ui/form/fields/primitive/SelectField";
import { slotRegistry } from "@ui/form/slots/SlotRegistry";
import type { FormField } from "@ui/form/fields";

const AtomTextField = withAtom(TextField);
const AtomFileField = withAtom(FileField);
const AtomRangeField = withAtom(RangeField);
const AtomAutocompleteField = withAtom(AutocompleteField);
const AtomSelectField = withAtom(SelectField);

// Register a sample dynamic slot component
slotRegistry.register("security-badge-slot", ({ field }) => (
  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-flex items-center gap-1">
    ✓ Encrypted
  </span>
));

slotRegistry.register("quick-copy-slot", ({ field, value }) => (
  <button
    type="button"
    onClick={() => navigator.clipboard?.writeText(String(value ?? ""))}
    className="text-[10px] text-primary hover:underline px-1.5 py-0.5 rounded bg-primary/10 cursor-pointer font-medium"
  >
    Copy
  </button>
));

const meta: Meta = {
  title: "Form/Architecture/FormDefinitionExtensions",
  parameters: {
    layout: "centered",
  },
};

export default meta;

/**
 * 1. Floating Label Mode (`labelPlacement="inline-floating"`)
 */
export const FloatingLabelMode: StoryObj = {
  render: () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("user@zenith.io");

    const nameField: FormField = {
      id: "floating-name",
      name: "name",
      type: "string",
      label: "Full Legal Name",
      required: true,
      properties: {
        labelPlacement: "inline-floating",
      },
    } as any;

    const emailField: FormField = {
      id: "floating-email",
      name: "email",
      type: "string",
      label: "Work Email",
      required: true,
      properties: {
        labelPlacement: "inline-floating",
      },
    } as any;

    return (
      <div className="w-[420px] p-6 rounded-2xl bg-surface border border-border shadow-xl flex flex-col gap-5">
        <div>
          <h2 className="text-base font-bold text-foreground">Floating Label Mode</h2>
          <p className="text-xs text-muted-foreground">
            Contract: <code className="text-primary font-mono">labelPlacement="inline-floating"</code>
          </p>
        </div>
        <AtomTextField
          field={nameField}
          value={name}
          onChange={setName}
          placeholder=""
        />
        <AtomTextField
          field={emailField}
          value={email}
          onChange={setEmail}
          placeholder=""
        />
      </div>
    );
  },
};

/**
 * 2. Contract-Driven FileField Dropzone with Chips
 */
export const FileFieldDropzone: StoryObj = {
  render: () => {
    const [files, setFiles] = useState<File[]>([
      new File(["doc content"], "project_spec_v2.pdf", { type: "application/pdf" }),
    ]);

    const dropzoneField: FormField = {
      id: "contract-dropzone",
      name: "attachments",
      type: "array",
      label: "Upload Documentation",
      required: true,
      properties: {
        variant: "dropzone",
        multiple: true,
        accept: ".pdf,.doc,.docx,.png",
        dropzone: {
          variant: "dropzone",
          maxFiles: 5,
          maxSizeBytes: 25 * 1024 * 1024,
          badge: {
            intent: "primary",
            variant: "soft",
            radius: "md",
          },
        },
      },
    } as any;

    return (
      <div className="w-[440px] p-6 rounded-2xl bg-surface border border-border shadow-xl flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Interactive Dropzone</h2>
          <p className="text-xs text-muted-foreground">
            Contract: <code className="text-primary font-mono">dropzone: FileDropzoneConfig</code>
          </p>
        </div>
        <AtomFileField
          field={dropzoneField}
          value={files}
          onChange={setFiles}
        />
      </div>
    );
  },
};

/**
 * 3. Contract-Driven RangeField Slider
 */
export const RangeFieldSlider: StoryObj = {
  render: () => {
    const [performanceRating, setPerformanceRating] = useState(75);

    const sliderField: FormField = {
      id: "contract-slider",
      name: "performanceRating",
      type: "number",
      label: "Performance Target",
      properties: {
        min: 0,
        max: 100,
        step: 5,
        slider: {
          showTooltip: "always",
          fillTrack: true,
          marks: [
            { value: 0, label: "0%" },
            { value: 25, label: "25%" },
            { value: 50, label: "50%" },
            { value: 75, label: "75%" },
            { value: 100, label: "100%" },
          ],
          badge: {
            intent: "primary",
            variant: "solid",
            radius: "full",
          },
        },
      },
    } as any;

    return (
      <div className="w-[440px] p-6 rounded-2xl bg-surface border border-border shadow-xl flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Elevated Range Slider</h2>
          <p className="text-xs text-muted-foreground">
            Contract: <code className="text-primary font-mono">slider: SliderConfig</code>
          </p>
        </div>
        <AtomRangeField
          field={sliderField}
          value={performanceRating}
          onChange={setPerformanceRating}
        />
      </div>
    );
  },
};

/**
 * 4. Massive Virtualization (> 5,000 Items at 60 FPS)
 */
export const VirtualScrollDropdown5000: StoryObj = {
  render: () => {
    const [selectedItem, setSelectedItem] = useState("item-42");

    // Generate 5,000 items
    const massiveOptions = Array.from({ length: 5000 }, (_, i) => ({
      value: `item-${i}`,
      label: `Enterprise Node #${i.toString().padStart(4, "0")} (Region US-East)`,
    }));

    const virtualSelectField: FormField = {
      id: "virtual-select",
      name: "nodeCluster",
      type: "string",
      component: "select",
      label: "Cluster Node Selector (5,000 Items)",
      options: massiveOptions,
      properties: {
        virtualization: {
          enabled: true,
          threshold: 100,
          itemHeight: 44,
          maxHeight: 260,
          overscan: 4,
        },
      },
    } as any;

    return (
      <div className="w-[440px] p-6 rounded-2xl bg-surface border border-border shadow-xl flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Windowed Virtual Scrolling</h2>
          <p className="text-xs text-muted-foreground">
            5,000 options rendered via zero-dependency pure React windowing
          </p>
        </div>
        <AtomSelectField
          field={virtualSelectField}
          value={selectedItem}
          onChange={setSelectedItem}
        />
      </div>
    );
  },
};

/**
 * 5. Dynamic Slot Injection via SlotRegistry
 */
export const DynamicSlotInjection: StoryObj = {
  render: () => {
    const [apiKey, setApiKey] = useState("zn_live_99f2b87483d9c8112");

    const apiKeyField: FormField = {
      id: "api-key-field",
      name: "apiKey",
      type: "string",
      label: "API Access Key",
      properties: {
        slots: {
          startContent: {
            slotId: "security-badge-slot",
          },
          endContent: {
            slotId: "quick-copy-slot",
          },
        },
      },
    } as any;

    return (
      <div className="w-[460px] p-6 rounded-2xl bg-surface border border-border shadow-xl flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Dynamic Slot Injection</h2>
          <p className="text-xs text-muted-foreground">
            Decoupled slots resolved via <code className="text-primary font-mono">SlotRegistry</code>
          </p>
        </div>
        <AtomTextField
          field={apiKeyField}
          value={apiKey}
          onChange={setApiKey}
        />
      </div>
    );
  },
};
