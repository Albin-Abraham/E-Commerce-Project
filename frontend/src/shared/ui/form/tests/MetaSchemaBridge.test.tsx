import { render, screen } from "@testing-library/react";
import { Form } from "@ui/form/Form";
import { describe, expect, it } from "vitest";

import { FormRenderer } from "../FormRenderer";
import { MetaSchemaBridge } from "../utils/MetaSchemaBridge";
import type { HeaderMetaSchema } from "../utils/MetaSchemaBridge";

const mockApiMetaSchema: HeaderMetaSchema = {
  id: "dynamic-api-onboarding",
  title: "Dynamic Employee Onboarding",
  description: "Dynamic payload fetched from dynamic ERP API.",
  fields: [
    {
      name: "fullName",
      type: "string",
      label: "Full Name",
      required: true,
      placeholder: "John Doe",
      gridCols: 12,
      group: "personal",
    },
    {
      name: "department",
      type: "select",
      label: "Department",
      options: ["Engineering", "Human Resources", "Sales"],
      gridCols: 6,
      group: "employment",
    },
    {
      name: "startDate",
      type: "date",
      label: "Start Date",
      required: true,
      gridCols: 6,
      group: "employment",
    },
  ],
};

describe("MetaSchemaBridge Compiler", () => {
  it("compiles a raw API metaSchema into a standard FormDefinition (RenderDefinition)", () => {
    const renderDefinition =
      MetaSchemaBridge.compileToFormDefinition(mockApiMetaSchema);

    expect(renderDefinition.id).toBe("dynamic-api-onboarding");
    expect(renderDefinition.title).toBe("Dynamic Employee Onboarding");
    expect(renderDefinition.sections).toHaveLength(2);

    const personalSection = renderDefinition.sections?.find(
      (s) => s.id === "dynamic-api-onboarding_section_personal"
    );
    expect(personalSection).toBeDefined();
    expect(personalSection?.fields).toHaveLength(1);
    expect(personalSection?.fields?.[0].name).toBe("fullName");
    expect(personalSection?.fields?.[0].type).toBe("text"); // Mapped 'string' -> 'text'

    const employmentSection = renderDefinition.sections?.find(
      (s) => s.id === "dynamic-api-onboarding_section_employment"
    );
    expect(employmentSection).toBeDefined();
    expect(employmentSection?.fields).toHaveLength(2);
    expect(employmentSection?.fields?.[0].name).toBe("department");
    expect(employmentSection?.fields?.[0].type).toBe("select");
    expect(employmentSection?.fields?.[0].options).toEqual([
      { label: "Engineering", value: "Engineering" },
      { label: "Human Resources", value: "Human Resources" },
      { label: "Sales", value: "Sales" },
    ]);
  });

  it("applies presentational UI overrides seamlessly (Data-Centric Styling)", () => {
    const uiOverrides = {
      fields: {
        fullName: {
          layout: { columnSpan: 8 },
          properties: { placeholder: "Enter your full legal name" },
        },
      },
      settings: {
        density: "compact",
      },
    };

    const renderDefinition = MetaSchemaBridge.compileToFormDefinition(
      mockApiMetaSchema,
      uiOverrides
    );
    const personalSection = renderDefinition.sections?.find(
      (s) => s.id === "dynamic-api-onboarding_section_personal"
    );

    expect((personalSection?.fields?.[0].layout as any)?.columnSpan).toBe(8);
    expect(personalSection?.fields?.[0].properties?.placeholder).toBe(
      "Enter your full legal name"
    );
    expect(renderDefinition.settings?.density).toBe("compact");
  });

  it("compiles an API metaSchema to high-density table column definitions", () => {
    const tableColumns =
      MetaSchemaBridge.compileToTableColumns(mockApiMetaSchema);

    expect(tableColumns).toHaveLength(3);
    expect(tableColumns[0].id).toBe("fullName");
    expect(tableColumns[0].header).toBe("Full Name");
    expect(tableColumns[0].accessor).toBe("fullName");
    expect(tableColumns[0].sortable).toBe(true);

    expect(tableColumns[1].id).toBe("department");
    expect(tableColumns[1].header).toBe("Department");
  });

  it("compiles a dynamic schema directly to a pure layout RenderDefinition without form properties", () => {
    // Schema devoid of form identity (no id or title)
    const anonymousSchema: HeaderMetaSchema = {
      fields: [{ name: "username", type: "string", label: "Username" }],
    };

    const renderDefinition =
      MetaSchemaBridge.compileToRenderDefinition(anonymousSchema);

    // Assert it contains pure rendering blocks (sections, settings, layout)
    expect(renderDefinition.sections).toHaveLength(1);
    expect(renderDefinition.sections[0].fields).toHaveLength(1);
    expect(renderDefinition.sections?.[0]?.fields?.[0]?.name).toBe("username");

    // Assert it is completely devoid of form metadata wrappers
    expect((renderDefinition as any).id).toBeUndefined();
    expect((renderDefinition as any).title).toBeUndefined();
    expect((renderDefinition as any).description).toBeUndefined();
  });

  it("dynamically injects custom slot components into the compiled definition", () => {
    const slotSchema: HeaderMetaSchema = {
      fields: [
        { name: "customUploader", type: "slot", label: "File Upload Slot" },
      ],
    };

    const DummyUploader = () => (
      <div data-testid="dummy-uploader">Custom Uploader UI</div>
    );
    const slots = {
      customUploader: DummyUploader,
    };

    const renderDefinition = MetaSchemaBridge.compileToRenderDefinition(
      slotSchema,
      {},
      slots
    );

    expect(renderDefinition.sections?.[0]?.fields?.[0]?.type).toBe("slot");
    expect(
      renderDefinition.sections?.[0]?.fields?.[0]?.meta?.ui?.component
    ).toBe(DummyUploader);
  });

  it("successfully renders a compiled definition in the Form engine", async () => {
    const renderDefinition =
      MetaSchemaBridge.compileToFormDefinition(mockApiMetaSchema);

    render(
      <Form definition={renderDefinition} onSubmit={async () => {}}>
        {/* Render standard container fields */}
      </Form>
    );

    const fullNameLabel = await screen.findByText("Full Name");
    expect(fullNameLabel).toBeInTheDocument();
  });

  it("successfully renders a pure RenderDefinition using the lightweight FormRenderer component", async () => {
    const renderDef =
      MetaSchemaBridge.compileToRenderDefinition(mockApiMetaSchema);

    render(<FormRenderer definition={renderDef} />);

    const fullNameLabel = await screen.findByText("Full Name");
    expect(fullNameLabel).toBeInTheDocument();
  });
});
