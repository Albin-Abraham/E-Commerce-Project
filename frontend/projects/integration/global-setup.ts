import { toHaveNoViolations } from "vitest-axe/dist/matchers";
import { expect } from "vitest";

expect.extend(toHaveNoViolations);