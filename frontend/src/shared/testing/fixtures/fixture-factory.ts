import { z } from "zod";

/**
 * Creates a schema-validated fixture factory function.
 * Ensures default values and overrides strictly adhere to domain invariants.
 * Throws a descriptive error at construction time if any fixture drifts from the domain schema.
 */
export const createValidatedFixture = <T>(
  schema: z.ZodType<T>,
  defaultValues: T
) => {
  // Validate defaults once on creation to catch developer mistakes immediately
  const initialCheck = schema.safeParse(defaultValues);
  if (!initialCheck.success) {
    throw new Error(
      `❌ [Invalid Base Fixture]: Default fixture values violate the domain schema.\n` +
        JSON.stringify(initialCheck.error.format(), null, 2)
    );
  }

  return (overrides?: Partial<T>): T => {
    const raw = { ...defaultValues, ...overrides };
    const result = schema.safeParse(raw);

    if (!result.success) {
      throw new Error(
        `❌ [Fixture Drift Detected]: Generated fixture violated domain schema.\n` +
          JSON.stringify(result.error.format(), null, 2)
      );
    }

    return result.data;
  };
};
