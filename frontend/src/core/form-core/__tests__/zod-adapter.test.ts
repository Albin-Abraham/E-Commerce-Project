import { describe, it, expect } from "vitest";
import { z } from "zod";
import { ZodValidationAdapter, createZodValidator } from "../adapters/zod-adapter";
import { FormCore } from "../engine";
import type { FormDefinition } from "../domain";

describe("ZodValidationAdapter (framework-free domain validation)", () => {
  const UserSchema = z
    .object({
      username: z.string().min(3, "Username must be at least 3 characters"),
      email: z.string().email("Invalid email address"),
      age: z.number().min(18, "Must be at least 18"),
      address: z.object({
        city: z.string().min(1, "City is required"),
        zip: z.string().regex(/^\d{5}$/, "Zip must be 5 digits"),
      }),
      password: z.string().min(6, "Password too short"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  type UserFormValues = z.infer<typeof UserSchema>;

  it("validates valid candidate values cleanly with 0 errors", () => {
    const adapter = new ZodValidationAdapter(UserSchema);
    const validData: UserFormValues = {
      username: "albin",
      email: "albin@example.com",
      age: 25,
      address: { city: "Munich", zip: "80331" },
      password: "secretpassword",
      confirmPassword: "secretpassword",
    };

    const errors = adapter.validateField(
      { id: "email", name: "email", type: "text", label: "Email" },
      "albin@example.com",
      validData
    );

    expect(errors).toHaveLength(0);
  });

  it("reports field-level errors when candidate value fails validation", () => {
    const adapter = createZodValidator(UserSchema);
    const currentData = {
      username: "albin",
      email: "invalid-email-format",
      age: 25,
      address: { city: "Munich", zip: "80331" },
      password: "secretpassword",
      confirmPassword: "secretpassword",
    };

    const errors = adapter.validateField(
      { id: "email", name: "email", type: "text", label: "Email" },
      "invalid-email-format",
      currentData
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].fieldId).toBe("email");
    expect(errors[0].message).toBe("Invalid email address");
  });

  it("evaluates cross-field .refine() rules during field validation", () => {
    const adapter = new ZodValidationAdapter(UserSchema);
    const dataWithMismatch = {
      username: "albin",
      email: "albin@example.com",
      age: 25,
      address: { city: "Munich", zip: "80331" },
      password: "secretpassword",
      confirmPassword: "differentpassword",
    };

    const errors = adapter.validateField(
      { id: "confirmPassword", name: "confirmPassword", type: "password", label: "Confirm Password" },
      "differentpassword",
      dataWithMismatch
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].fieldId).toBe("confirmPassword");
    expect(errors[0].message).toBe("Passwords do not match");
  });

  it("validates the entire form and returns structured field errors", () => {
    const adapter = new ZodValidationAdapter(UserSchema);
    const invalidData = {
      username: "a", // too short
      email: "not-an-email",
      age: 15, // under 18
      address: { city: "", zip: "abc" },
      password: "123",
      confirmPassword: "456",
    } as any;

    const formErrors = adapter.validateForm(invalidData);

    expect(formErrors["username"]).toBeDefined();
    expect(formErrors["email"]).toBeDefined();
    expect(formErrors["age"]).toBeDefined();
    expect(formErrors["address.city"]).toBeDefined();
    expect(formErrors["address.zip"]).toBeDefined();
    expect(formErrors["confirmPassword"]).toBeDefined();
  });

  it("integrates natively into FormCore via options.schema", async () => {
    const SimpleSchema = z.object({
      title: z.string().min(5, "Title must be at least 5 chars"),
      amount: z.number().positive("Amount must be positive"),
    });

    type SimpleValues = z.infer<typeof SimpleSchema>;

    const definition: FormDefinition<SimpleValues> = {
      id: "simple-form",
      fields: [
        { id: "title", name: "title", type: "text", label: "Title" },
        { id: "amount", name: "amount", type: "number", label: "Amount" },
      ],
    };

    const form = new FormCore<SimpleValues>(definition, { title: "Test", amount: 10 }, {
      schema: SimpleSchema,
      validationMode: "onChange",
      validationDebounceMs: 0,
    });

    // Initial state after construction
    expect(form.isValid).toBe(true);

    // setValue triggers validation pipeline via ZodValidationAdapter immediately (debounce 0)
    await form.setValue("title", "Abc"); // too short (< 5)
    expect(form.validity["title"]?.valid).toBe(false);
    expect(form.validity["title"]?.errors?.[0]?.message).toBe("Title must be at least 5 chars");

    // Setting a valid value clears the error
    await form.setValue("title", "Valid Title Here");
    expect(form.validity["title"]?.valid).toBe(true);
    expect(form.validity["title"]?.errors).toHaveLength(0);

    // Submit validation
    await form.setValue("amount", -5); // negative amount
    const submitResult = await form.submit();
    expect(submitResult).toBe(false);
    expect(form.validity["amount"]?.valid).toBe(false);
    expect(form.validity["amount"]?.errors?.[0]?.message).toBe("Amount must be positive");
  });
});
