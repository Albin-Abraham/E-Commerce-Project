import { describe, it, expect, expectTypeOf, assertType } from "vitest";
import type { FieldPath, AutocompletePath, PathValue } from "../domain/paths";
import { FormCore } from "../engine";
import { Form } from "../form";
import type { FormDefinition, FormField } from "../domain";

interface NestedProfile {
  username: string;
  age: number;
  isActive: boolean;
  contact: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      zipCode: string;
    };
  };
  tags: string[];
  memberships: Array<{ tier: string; points: number }>;
}

describe("TypeScript Autocomplete & Path Type System", () => {
  describe("FieldPath<T>", () => {
    it("generates exact union of top-level and nested property paths", () => {
      type Paths = FieldPath<NestedProfile>;

      // Top level
      expectTypeOf<"username">().toMatchTypeOf<Paths>();
      expectTypeOf<"age">().toMatchTypeOf<Paths>();
      expectTypeOf<"isActive">().toMatchTypeOf<Paths>();
      expectTypeOf<"contact">().toMatchTypeOf<Paths>();
      expectTypeOf<"tags">().toMatchTypeOf<Paths>();
      expectTypeOf<"memberships">().toMatchTypeOf<Paths>();

      // Nested level 1
      expectTypeOf<"contact.email">().toMatchTypeOf<Paths>();
      expectTypeOf<"contact.phone">().toMatchTypeOf<Paths>();
      expectTypeOf<"contact.address">().toMatchTypeOf<Paths>();

      // Nested level 2
      expectTypeOf<"contact.address.city">().toMatchTypeOf<Paths>();
      expectTypeOf<"contact.address.zipCode">().toMatchTypeOf<Paths>();

      // Array indices and nested array object properties
      expectTypeOf<`tags.${number}`>().toMatchTypeOf<Paths>();
      expectTypeOf<`memberships.${number}`>().toMatchTypeOf<Paths>();
      expectTypeOf<`memberships.${number}.tier`>().toMatchTypeOf<Paths>();
      expectTypeOf<`memberships.${number}.points`>().toMatchTypeOf<Paths>();
    });
  });

  describe("PathValue<T, P>", () => {
    it("extracts exact primitive and complex types at any depth", () => {
      expectTypeOf<PathValue<NestedProfile, "username">>().toEqualTypeOf<string>();
      expectTypeOf<PathValue<NestedProfile, "age">>().toEqualTypeOf<number>();
      expectTypeOf<PathValue<NestedProfile, "isActive">>().toEqualTypeOf<boolean>();
      expectTypeOf<PathValue<NestedProfile, "contact.email">>().toEqualTypeOf<string>();
      expectTypeOf<PathValue<NestedProfile, "contact.address.city">>().toEqualTypeOf<string>();
      expectTypeOf<PathValue<NestedProfile, "tags">>().toEqualTypeOf<string[]>();
      expectTypeOf<PathValue<NestedProfile, "tags.0">>().toEqualTypeOf<string>();
      expectTypeOf<PathValue<NestedProfile, "memberships.0.tier">>().toEqualTypeOf<string>();
      expectTypeOf<PathValue<NestedProfile, "memberships.0.points">>().toEqualTypeOf<number>();
    });
  });

  describe("AutocompletePath<T>", () => {
    it("accepts known paths with full autocomplete while permitting dynamic strings", () => {
      type Path = AutocompletePath<NestedProfile>;

      const known1: Path = "username";
      const known2: Path = "contact.address.city";
      const customDynamic: Path = "custom_dynamic_runtime_key";

      expect(known1).toBe("username");
      expect(known2).toBe("contact.address.city");
      expect(customDynamic).toBe("custom_dynamic_runtime_key");
    });
  });

  describe("FormCore<T> and Form<T> Type-Safe Autocomplete API", () => {
    it("type-checks setValue and getValue parameter types matching the path", async () => {
      const definition: FormDefinition<NestedProfile> = {
        id: "profile-form",
        fields: [
          { id: "username", name: "username", type: "text", label: "Username" },
          { id: "city", name: "contact.address.city", type: "text", label: "City" },
        ],
      };

      const form = new Form<NestedProfile>(definition, {
        username: "test",
        contact: {
          email: "test@example.com",
          phone: "123",
          address: {
            street: "Main St",
            city: "Berlin",
            zipCode: "10115",
          },
        },
      });

      // setValue type enforcement
      await form.setValue("username", "new_user");
      await form.setValue("age", 30);
      await form.setValue("isActive", true);

      // getValue type extraction
      const city = form.getValue("contact.address.city");
      expectTypeOf(city).toEqualTypeOf<string>();

      const age = form.getValue("age");
      expectTypeOf(age).toEqualTypeOf<number>();

      expect(form.values.username).toBe("new_user");
    });
  });
});
