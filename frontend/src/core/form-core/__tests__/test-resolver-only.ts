import { FieldRegistry } from "../modules/field-registry";
import { FieldResolver } from "../modules/resolver";

// Mock Definition
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

async function runResolverTest() {
  console.log("Starting Resolver Isolation Test...");

  const registry = new FieldRegistry(definition);
  const resolver = new FieldResolver(registry);

  // 1. Resolve Repeater by Name
  // Users (Repeater) should be in map now
  const users = resolver.resolveField("users");
  if (!users || users.id !== "users")
    throw new Error("Failed to resolve 'users' repeater by name");
  console.log("✅ Repeater resolution by name passed");

  // 2. Simple Nested Resolution
  // users[0].userName
  const simple = resolver.resolveField("users[0].userName");
  if (!simple) throw new Error("Failed to resolve users[0].userName");
  if (simple.name !== "users[0].userName")
    throw new Error("Virtual name mismatch: " + simple.name);
  console.log("✅ simple nested resolution passed");

  // 3. Deep Nested Resolution
  // users[0].addresses[1].street
  const deep = resolver.resolveField("users[0].addresses[1].street");
  if (!deep) throw new Error("Failed to resolve users[0].addresses[1].street");
  if (deep.name !== "users[0].addresses[1].street")
    throw new Error("Virtual name mismatch: " + deep.name);
  console.log("✅ deep nested resolution passed");
}

runResolverTest().catch((e) => {
  console.error("❌ Test Failed:", e);
});
