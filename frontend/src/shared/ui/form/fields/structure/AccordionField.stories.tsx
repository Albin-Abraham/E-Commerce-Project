import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { Form } from "../../Form";
import type { FormDefinition } from "../../types";

const accordionDemoForm: FormDefinition = {
  id: "accordion-demo",
  title: "Server Cluster Configuration",
  description: "Expand each section to configure network and telemetry parameters.",
  sections: [
    {
      id: "cluster-settings",
      title: "Cluster Settings",
      fields: [
        {
          id: "general-accordion",
          name: "generalAccordion",
          type: "accordion",
          label: "1. Basic Cluster Attributes",
          description: "Cluster naming, region, and primary DNS endpoint.",
          customData: { defaultOpen: true },
          fields: [
            {
              id: "cluster-name",
              name: "clusterName",
              type: "text",
              label: "Cluster Identifier",
              initialValue: "k8s-prod-us-east-1",
              layout: { columnSpan: 6 },
            },
            {
              id: "cluster-region",
              name: "region",
              type: "select",
              label: "Cloud Region",
              options: [
                { label: "US East (N. Virginia)", value: "us-east-1" },
                { label: "EU West (Ireland)", value: "eu-west-1" },
                { label: "AP South (Mumbai)", value: "ap-south-1" },
              ],
              initialValue: "us-east-1",
              layout: { columnSpan: 6 },
            },
          ],
        },
        {
          id: "network-accordion",
          name: "networkAccordion",
          type: "accordion",
          label: "2. Advanced Networking & VPC",
          description: "Subnets, CIDR blocks, and ingress security policies.",
          customData: { defaultOpen: false },
          fields: [
            {
              id: "vpc-cidr",
              name: "vpcCidr",
              type: "text",
              label: "VPC CIDR Block",
              initialValue: "10.0.0.0/16",
              layout: { columnSpan: 12 },
            },
            {
              id: "enable-nat",
              name: "enableNatGateway",
              type: "switch",
              label: "Provision Managed NAT Gateways",
              initialValue: true,
              layout: { columnSpan: 12 },
            },
          ],
        },
        {
          id: "telemetry-accordion",
          name: "telemetryAccordion",
          type: "accordion",
          label: "3. Observability & Logging",
          description: "Prometheus scraping and OpenTelemetry collector pipeline.",
          customData: { defaultOpen: false },
          fields: [
            {
              id: "retention-days",
              name: "retentionDays",
              type: "number",
              label: "Log Retention (Days)",
              initialValue: 30,
              layout: { columnSpan: 6 },
            },
            {
              id: "export-jaeger",
              name: "exportJaeger",
              type: "checkbox",
              label: "Stream Traces to Jaeger",
              initialValue: false,
              layout: { columnSpan: 6 },
            },
          ],
        },
      ],
    },
  ],
};

const meta: Meta<typeof Form> = {
  title: "Form/Structure/AccordionField",
  component: Form,
  tags: ["autodocs"],
  args: {
    definition: accordionDemoForm,
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);

    // Click the second accordion header to expand it
    const networkHeader = canvas.getByText(/2. Advanced Networking & VPC/i);
    await user.click(networkHeader);
  },
};
