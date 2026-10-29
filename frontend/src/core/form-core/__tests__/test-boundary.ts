import { FormCore } from "../engine";

// Deeply Nested Definition
const definition = {
  id: "nested-form",
  name: "Nested Form",
  sections: [
    {
      id: "main",
      title: "Main",
      fields: [
        {
          id: "users",
          name: "users",
          type: "repeater",
          label: "Users",
          fields: [
            {
              id: "userName",
              name: "userName",
              type: "text",
              label: "User Name",
            },
            {
              id: "addresses",
              name: "addresses",
              type: "repeater",
              label: "Addresses",
              fields: [
                { id: "street", name: "street", type: "text", label: "Street" },
              ],
            },
          ],
        },
      ],
    },
  ],
} as any;

async function runBoundaryTest() {
  console.log("Starting Boundary Test...");
  const form = new FormCore(definition);

  // 1. Simple Nested Resolution
  // Expected: users[0].userName -> Valid
  const simple = form.resolveField("users[0].userName");
  if (!simple) throw new Error("Failed to resolve users[0].userName");
  console.log("✅ simple resolution passed");

  // 2. Deep Nested Resolution
  // Expected: users[0].addresses[1].street -> Should be valid?
  // Current Regex: ^(.+)\[(\d+)\]\.(.+)$
  // users[0].addresses[1].street matches:
  // Group 1: users[0].addresses
  // Group 2: 1
  // Group 3: street
  // This assumes users[0].addresses can be resolved recursively as a paretn!

  const deep = form.resolveField("users[0].addresses[1].street");
  if (!deep) throw new Error("Failed to resolve users[0].addresses[1].street");
  console.log("✅ deep resolution passed");
}

runBoundaryTest().catch((e) => {
  console.error("❌ Test Failed:", e);
});
