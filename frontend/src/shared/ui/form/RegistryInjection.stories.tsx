import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "./Form";
import { RegistryStore } from "@ui/form/registry";
import type { FormDefinition } from "@form-core/domain";

const meta: Meta<typeof Form> = {
  title: "Form/Orchestration/Registry Dynamic Injection",
  component: Form,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

// 1. Create a Custom Field Component
const CustomBanner = ({ label, properties }: any) => (
  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 rounded-2xl text-white shadow-xl mb-6">
    <h2 className="text-3xl font-black">{label}</h2>
    <p className="opacity-80 mt-2">
      {properties?.description || "Custom Registered Component"}
    </p>
  </div>
);

// 2. Create a Registry Override
const customRegistry = new RegistryStore();

// Register a new type
customRegistry.register("hero-banner", CustomBanner);

// Override a core type
customRegistry.register("text", (props: any) => (
  <div className="border-2 border-dashed border-primary/30 p-4 rounded-xl">
    <label className="block text-[10px] uppercase font-bold text-primary mb-1">
      Overridden Text Field
    </label>
    <input
      {...props}
      className="w-full bg-transparent border-none outline-none text-lg font-medium"
      placeholder="Type here..."
    />
  </div>
));

const registryDemo: FormDefinition = {
  id: "registry-demo",
  title: "Dynamic Registry Demo",
  description:
    "Demonstrating how to inject custom fields and override core ones.",
  sections: [
    {
      id: "header",
      title: "Custom Header",
      fields: [
        {
          id: "banner_1",
          name: "banner",
          type: "hero-banner" as any,
          label: "Welcome to V2",
          properties: {
            description:
              "This component was registered externally to the core engine.",
          },
        },
      ],
    },
    {
      id: "main",
      title: "Standard vs Custom",
      fields: [
        {
          id: "standard_text",
          name: "normalField",
          type: "text",
          label: "Normal Text Field (Now Overridden)",
          layout: { columnSpan: 12 },
        },
        {
          id: "standard_switch",
          name: "normalSwitch",
          type: "switch",
          label: "Normal Switch (Still Core)",
          layout: { columnSpan: 12 },
        },
      ],
    },
  ],
};

export const CustomFieldInjection: Story = {
  args: {
    definition: registryDemo,
    registry: customRegistry,
    debug: true,
  },
};
