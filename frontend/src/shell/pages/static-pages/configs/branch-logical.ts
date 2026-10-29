import type { FieldType } from "@ui/form/fields";
import type {
  ContentDefinition,
  EntityDefinition,
} from "@ui/form/types/application";
import type { BehaviorDefinition } from "@ui/form/types/behavior";

import { BranchValidationRules } from "../validations/branch-rules";
import { buildBranchPresentation, buildBranchSurface } from "./branch-surface";

export interface BranchFormData extends Record<string, any> {
  name: string;
  code: string;
  type: string;
  openingDate: string;
  manager: string;
  status: string;
  address?: Record<string, any>;
}

// ── LAYER 1: CONTENT SCHEMA ──────────────────────────────────────────────────

const BranchContent: ContentDefinition<BranchFormData> = {
  id: "branch-content",
  title: "Branch Deployment Engine",
  description:
    "Orchestrate new corporate branch infrastructure with localized operational parameters and network identity.",
  sections: [
    {
      id: "branch-identity",
      title: "Core Identity",
      description: "Define the branch's unique signature and corporate code.",
      layout: {
        type: "card",
        variant: "glass",
        elevation: "lg",
        gap: "xl",
        wrapOuter: false,
      },
      properties: { labelPlacement: "side" },
      fields: [
        {
          id: "branch_name",
          name: "name",
          type: "text",
          label: "Branch Name",
          required: true,
          validation: BranchValidationRules.validations.name,
          layout: { columnSpan: 8 },
          properties: {
            placeholder: "e.g. Downtown Headquarters",
            autoFocus: true,
            intent: "primary",
          },
          meta: { ui: { icon: "building" } },
        },
        {
          id: "branch_code",
          name: "code",
          type: "text",
          label: "Branch Code",
          required: true,
          validation: BranchValidationRules.validations.code,
          layout: { columnSpan: 4 },
          properties: {
            placeholder: "BR-001",
            description: "Internal reference ID (Format: BR-000)",
          },
          meta: { ui: { icon: "hash" } },
        },
      ],
    },
    {
      id: "branch-type-date",
      title: "Logistics & Timing",
      description: "Functional classification and deployment schedule.",
      layout: {
        type: "card",
        variant: "glass",
        elevation: "lg",
        gap: "xl",
        wrapOuter: false,
      },
      properties: { labelPlacement: "side" },
      fields: [
        {
          id: "branch_type",
          name: "type",
          type: "select",
          label: "Facility Type",
          required: true,
          options: [
            { label: "Headquarters", value: "HQ" },
            { label: "Regional Office", value: "RO" },
            { label: "Satellite Branch", value: "SB" },
            { label: "Warehouse", value: "WH" },
          ],
          layout: { columnSpan: 6 },
          properties: { intent: "info" },
          meta: { ui: { icon: "map-pin" } },
        },
        {
          id: "opening_date",
          name: "openingDate",
          type: "date",
          component: "date",
          label: "Official Opening Date",
          required: true,
          layout: { columnSpan: 6 },
          meta: { ui: { icon: "calendar" } },
        },
      ],
    },
    {
      id: "location-details",
      title: "Geospatial Data",
      description: "Physical address and regional mappings.",
      layout: { type: "card", elevation: "lg", gap: "xl", wrapOuter: false },
      properties: { labelPlacement: "side" },
      meta: {
        ui: {
          classNames: {
            base: "z-card z-card--glass !bg-white/60 dark:!bg-black/60 backdrop-blur-2xl border border-white/40 shadow-2xl ring-1 ring-black/5",
            header:
              "px-8 py-6 border-b border-white/30 bg-white/40 dark:bg-black/40 rounded-t-[var(--radius-xl)]",
          },
        },
      },
      fields: [
        {
          id: "address-group",
          name: "address",
          type: "branch-address-group" as FieldType,
          label: "Physical Address",
          properties: { gridCols: 2 },
          headless: true,
        },
      ],
    },
    {
      id: "operational-contact",
      title: "Leadership & Status",
      description: "Management oversight and current operational state.",
      layout: { type: "card", elevation: "lg", gap: "xl", wrapOuter: false },
      properties: { labelPlacement: "side" },
      meta: {
        ui: {
          classNames: {
            base: "z-card z-card--glass !bg-white/60 dark:!bg-black/60 backdrop-blur-2xl border border-white/40 shadow-2xl ring-1 ring-black/5",
            header:
              "px-8 py-6 border-b border-white/30 bg-white/40 dark:bg-black/40 rounded-t-[var(--radius-xl)]",
          },
        },
      },
      fields: [
        {
          id: "manager_name",
          name: "manager",
          type: "text",
          label: "Branch Manager",
          required: true,
          layout: { columnSpan: 6 },
          meta: { ui: { icon: "user-check" } },
        },
        {
          id: "contact_status",
          name: "status",
          type: "select",
          label: "Operational Status",
          required: true,
          options: [
            { label: "Active", value: "active" },
            { label: "Under Construction", value: "construction" },
            { label: "Closed", value: "closed" },
          ],
          layout: { columnSpan: 6 },
          meta: { ui: { icon: "activity" } },
        },
      ],
    },
  ],
};

// ── LAYER 4: BEHAVIOR SCHEMA ─────────────────────────────────────────────────

const BranchBehavior: BehaviorDefinition<BranchFormData> = {
  rules: [
    {
      id: "hide-opening-date",
      condition: "isConstruction",
      action: "hide",
      targetField: "openingDate",
    },
  ],
  pipeline: {
    middleware: [
      (formData) => {
        if (formData.code) {
          formData.code = formData.code.toUpperCase();
        }
      },
    ],
  },
  events: {},
};

// ── LAYER 6: ENTITY DEFINITION ───────────────────────────────────────────────

export const buildBranchEntity = (): EntityDefinition<BranchFormData> => ({
  id: "entity-branch",
  name: "Corporate Branch",
  content: BranchContent,
  behavior: BranchBehavior,
  surface: buildBranchSurface(),
  presentation: buildBranchPresentation(),
});
