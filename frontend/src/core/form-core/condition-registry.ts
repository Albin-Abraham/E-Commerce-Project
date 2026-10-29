/**
 * @file condition-registry.ts
 * @description Central plugin-based registry for condition operators.
 *
 * Follows the Open/Closed principle: Add new operators here without
 * modifying the core ConditionProxy evaluation logic.
 */

export type ConditionOperatorFn = (
  fieldValue: any,
  targetValue: any
) => boolean;

class ConditionOperatorRegistry {
  private static instance: ConditionOperatorRegistry;
  private operators: Map<string, ConditionOperatorFn> = new Map();

  private constructor() {
    this.registerDefaultOperators();
  }

  public static getInstance(): ConditionOperatorRegistry {
    if (!ConditionOperatorRegistry.instance) {
      ConditionOperatorRegistry.instance = new ConditionOperatorRegistry();
    }
    return ConditionOperatorRegistry.instance;
  }

  /**
   * Registers a custom operator.
   * @example
   * registry.register("isPrime", (val) => isPrime(val));
   */
  public register(name: string, fn: ConditionOperatorFn) {
    this.operators.set(name, fn);
  }

  /**
   * Evaluates a value against a target using a registered operator.
   */
  public evaluate(name: string, fieldValue: any, targetValue: any): boolean {
    const fn = this.operators.get(name);
    if (!fn) {
      console.warn(
        `[ConditionRegistry] Unknown operator: "${name}". Returning false.`
      );
      return false;
    }
    return fn(fieldValue, targetValue);
  }

  private registerDefaultOperators() {
    this.register("equals", (a, b) => a == b);
    this.register("eq", (a, b) => a == b);
    this.register("notEquals", (a, b) => a != b);
    this.register("ne", (a, b) => a != b);
    this.register("neq", (a, b) => a != b);

    this.register("greaterThan", (a, b) => Number(a) > Number(b));
    this.register("gt", (a, b) => Number(a) > Number(b));
    this.register("lessThan", (a, b) => Number(a) < Number(b));
    this.register("lt", (a, b) => Number(a) < Number(b));
    this.register("greaterThanOrEqual", (a, b) => Number(a) >= Number(b));
    this.register("gte", (a, b) => Number(a) >= Number(b));
    this.register("lessThanOrEqual", (a, b) => Number(a) <= Number(b));
    this.register("lte", (a, b) => Number(a) <= Number(b));

    this.register("between", (val, range) => {
      const [min, max] = Array.isArray(range) ? range : [];
      const num = Number(val);
      return num >= Number(min) && num <= Number(max);
    });

    this.register("notBetween", (val, range) => {
      const [min, max] = Array.isArray(range) ? range : [];
      const num = Number(val);
      return num < Number(min) || num > Number(max);
    });

    this.register("contains", (val, target) =>
      Array.isArray(val)
        ? val.includes(target)
        : String(val).includes(String(target))
    );

    this.register(
      "in",
      (val, list) => Array.isArray(list) && list.includes(val)
    );
    this.register(
      "notIn",
      (val, list) => Array.isArray(list) && !list.includes(val)
    );

    this.register("startsWith", (val, prefix) =>
      String(val).startsWith(String(prefix))
    );
    this.register("endsWith", (val, suffix) =>
      String(val).endsWith(String(suffix))
    );

    this.register(
      "empty",
      (val) => val === null || val === undefined || val === ""
    );
    this.register(
      "notEmpty",
      (val) => val !== null && val !== undefined && val !== ""
    );

    this.register("regex", (val, pattern) =>
      new RegExp(pattern).test(String(val))
    );
  }
}

export const conditionRegistry = ConditionOperatorRegistry.getInstance();
export { ConditionOperatorRegistry, ConditionOperatorRegistry as ConditionRegistry };
