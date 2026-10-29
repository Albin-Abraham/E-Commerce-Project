import type { FormDefinition } from "../domain";
import { describe, expect, it } from "vitest";

import { FormCore } from "../engine";

describe("FormCore Computed Fields", () => {
  const mockDefinition: FormDefinition = {
    id: "test-form",
    title: "Test Form",
    sections: [
      {
        id: "section1",
        title: "Section 1",
        fields: [
          {
            id: "opening_date_id",
            name: "openingDate",
            type: "date",
            label: "Official Opening Date",
          },
          {
            id: "est_deployment_date_id",
            name: "estDeploymentDate",
            type: "date",
            label: "Estimated Deployment Date",
            computed: {
              formula: "addDays({{openingDate}}, 10)",
              dependsOn: ["openingDate"],
              returnType: "string",
            },
          },
          {
            id: "final_review_date_id",
            name: "finalReviewDate",
            type: "date",
            label: "Final Review Date",
            computed: {
              formula: "addDays({{estDeploymentDate}}, 5)",
              dependsOn: ["estDeploymentDate"],
              returnType: "string",
            },
          },
        ],
      },
    ],
  };

  it("should recalculate computed field when dependency changes", async () => {
    const engine = new FormCore(mockDefinition);

    // Initial state
    expect(engine.state.values.openingDate).toBeNull();

    // Set dependency
    await engine.setValue("openingDate", "2026-03-23");

    // Check computed field
    expect(engine.state.values.estDeploymentDate).toBe("2026-04-02");
  });

  it("should support recursive recalculation (multi-level dependencies)", async () => {
    const engine = new FormCore(mockDefinition);

    // Set root dependency
    await engine.setValue("openingDate", "2026-03-23");

    // Check level 1
    expect(engine.state.values.estDeploymentDate).toBe("2026-04-02");

    // Check level 2 (depends on level 1)
    expect(engine.state.values.finalReviewDate).toBe("2026-04-07");
  });

  it("should correctly match dependencies using field names even if IDs are different", async () => {
    const customDef: FormDefinition = {
      id: "custom-form",
      title: "Custom Form",
      sections: [
        {
          id: "s1",
          title: "Custom",
          fields: [
            {
              id: "custom_id_1",
              name: "price",
              type: "number",
              label: "Price",
            },
            {
              id: "custom_id_2",
              name: "total",
              type: "number",
              label: "Total",
              computed: {
                formula: "{{price}} * 1.2",
                dependsOn: ["price"],
                returnType: "number",
              },
            },
          ],
        },
      ],
    };

    const engine = new FormCore(customDef);
    await engine.setValue("price", 100);

    expect(engine.state.values.total).toBe(120);
  });
});
