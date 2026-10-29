import type { FormDefinition } from "@ui/form/types";
import { describe, it } from "vitest";

import { LogicBranchingDriver } from "../drivers/LogicBranchingDriver";

const BRANCH_FIXTURE: FormDefinition = {
  id: "branch-test",
  title: "Branch Test",
  settings: {
    wizard: { enabled: true, linear: true },
  },
  sections: [
    {
      id: "step-1",
      title: "Navigation Root",
      nextStep: (values: Record<string, any>) =>
        values.path === "b" ? "step-b" : "step-a",
      fields: [
        {
          id: "path-select",
          name: "path",
          type: "select",
          label: "Choice",
          options: [
            { label: "Path A", value: "a" },
            { label: "Path B", value: "b" },
          ],
        },
      ],
    },
    {
      id: "step-a",
      title: "Path A Content",
      nextStep: "step-end",
      fields: [{ id: "field-a", name: "fa", type: "text", label: "A" }],
    },
    {
      id: "step-b",
      title: "Path B Content",
      nextStep: "step-end",
      fields: [{ id: "field-b", name: "fb", type: "text", label: "B" }],
    },
    {
      id: "step-end",
      title: "End",
      fields: [{ id: "field-end", name: "fe", type: "text", label: "Done" }],
    },
  ],
};

describe("Logic Branching Engine Verification", () => {
  it("navigates Path A correctly", async () => {
    const { driver } = await LogicBranchingDriver.render(BRANCH_FIXTURE);

    await driver.expectStep("Navigation Root");

    // Default is Path A (if logic defaults to a or we select it)
    await driver.selectOption("Path A");
    await driver.clickNext();

    await driver.expectStep("Path A Content");
    await driver.expectField("field-a");
    await driver.expectFieldGone("field-b");
  });

  it("navigates Path B correctly (Logic Jump)", async () => {
    const { driver } = await LogicBranchingDriver.render(BRANCH_FIXTURE);

    await driver.expectStep("Navigation Root");

    await driver.selectOption("Path B");
    await driver.clickNext();

    await driver.expectStep("Path B Content");
    await driver.expectField("field-b");
    await driver.expectFieldGone("field-a");

    // Converge
    await driver.clickNext();
    await driver.expectStep("End");
  });

  it("maintains a stable History Stack for backtracking", async () => {
    const { driver } = await LogicBranchingDriver.render(BRANCH_FIXTURE);

    // 1. Go to Path B
    await driver.selectOption("Path B");
    await driver.clickNext();
    await driver.expectStep("Path B Content");

    // 2. Go to End
    await driver.clickNext();
    await driver.expectStep("End");

    // 3. Backtrack to Path B
    await driver.clickBack();
    await driver.expectStep("Path B Content");
    await driver.expectField("field-b");

    // 4. Backtrack to Root
    await driver.clickBack();
    await driver.expectStep("Navigation Root");
  });
});
