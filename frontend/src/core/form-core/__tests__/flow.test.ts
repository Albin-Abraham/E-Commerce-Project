import type { FormDefinition } from "../domain";
import { describe, expect, it } from "vitest";

import { FormCore } from "../engine";

describe("Flow Engine (FlowProxy)", () => {
  // 1. Sequential Flow Definition
  const sequentialDef: FormDefinition = {
    id: "seq-test",
    title: "Sequential Test",
    sections: [
      { id: "s1", title: "Step 1", fields: [] },
      { id: "s2", title: "Step 2", fields: [] },
      { id: "s3", title: "Step 3", fields: [] },
    ],
  };

  it("should handle sequential navigation correctly", () => {
    const engine = new FormCore(sequentialDef);

    expect(engine.flow.getNextStep("s1")).toBe("s2");
    expect(engine.flow.getNextStep("s2")).toBe("s3");
    expect(engine.flow.getNextStep("s3")).toBeNull();

    expect(engine.flow.isLastStep("s2")).toBe(false);
    expect(engine.flow.isLastStep("s3")).toBe(true);
  });

  // 2. Conditional Flow Definition (Static ID)
  const staticBranchDef: FormDefinition = {
    id: "static-branch",
    title: "Static Branch",
    sections: [
      {
        id: "start",
        title: "Start",
        fields: [],
        nextStep: "branch-a", // Explicit override (skip middle?)
      },
      { id: "middle", title: "Middle", fields: [] },
      { id: "branch-a", title: "Branch A", fields: [] },
    ],
  };

  it("should handle static branching", () => {
    const engine = new FormCore(staticBranchDef);
    // Should skip 'middle' because of explicit nextStep
    expect(engine.flow.getNextStep("start")).toBe("branch-a");
  });

  // 3. Dynamic Flow Definition (Function)
  const dynamicDef: FormDefinition = {
    id: "dynamic-flow",
    title: "Dynamic Flow",
    sections: [
      {
        id: "question",
        title: "Question",
        fields: [{ id: "q1", name: "choice", type: "text", label: "Choice" }],
        nextStep: (values: any) => {
          return values.choice === "A" ? "path-a" : "path-b";
        },
      },
      { id: "path-a", title: "Path A", fields: [] },
      { id: "path-b", title: "Path B", fields: [] },
    ],
  };

  it("should handle dynamic function-based branching", async () => {
    const engine = new FormCore(dynamicDef, { choice: "A" });

    expect(engine.flow.getNextStep("question")).toBe("path-a");

    // Change value
    await engine.setValue("choice", "B");
    expect(engine.flow.getNextStep("question")).toBe("path-b");
  });

  // 4. Broken Flow / Invalid ID
  it("should return null if current step is not found", () => {
    const engine = new FormCore(sequentialDef);
    expect(engine.flow.getNextStep("unknown")).toBeNull();
  });
});
