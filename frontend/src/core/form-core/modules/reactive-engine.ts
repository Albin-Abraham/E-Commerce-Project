import type { ComputedField, ReactiveValue } from "../domain";
import { get } from "lodash-es";

type HelperFunction = (...args: any[]) => any;

/**
 * Evaluates reactive expressions like `{{ fieldName }}` in form schemas.
 *
 * ⚠️ Security: Uses `new Function()` to evaluate expressions. The schema AST
 * is interpolated directly into the function body. **Only pass trusted schemas.**
 * Do NOT use with user-supplied expression strings unless they have been
 * validated against an allow-list of known-safe patterns.
 *
 * @internal
 */
export class ReactiveEngine {
  private values: Record<string, any> = {};
  private helpers: Record<string, HelperFunction> = {};

  constructor(initialValues: Record<string, any> = {}) {
    this.values = initialValues;
    this.registerDefaultHelpers();
  }

  updateValues(values: Record<string, any>) {
    this.values = values;
  }

  registerHelper(name: string, fn: HelperFunction) {
    this.helpers[name] = fn;
  }

  private registerDefaultHelpers() {
    this.registerHelper("today", () => {
      return new Date().toISOString().split("T")[0];
    });

    this.registerHelper("now", () => {
      return new Date().toISOString();
    });

    this.registerHelper("addDays", (date: string, days: number) => {
      const d = new Date(date);
      d.setDate(d.getDate() + days);
      return d.toISOString().split("T")[0];
    });

    this.registerHelper("addMonths", (date: string, months: number) => {
      const d = new Date(date);
      d.setMonth(d.getMonth() + months);
      return d.toISOString().split("T")[0];
    });

    this.registerHelper("addYears", (date: string, years: number) => {
      const d = new Date(date);
      d.setFullYear(d.getFullYear() + years);
      return d.toISOString().split("T")[0];
    });

    this.registerHelper("addHours", (date: string, hours: number) => {
      const d = new Date(date);
      d.setHours(d.getHours() + hours);
      return d.toISOString();
    });

    this.registerHelper("addMinutes", (date: string, minutes: number) => {
      const d = new Date(date);
      d.setMinutes(d.getMinutes() + minutes);
      return d.toISOString();
    });

    this.registerHelper("min", (...args: number[]) => Math.min(...args));
    this.registerHelper("max", (...args: number[]) => Math.max(...args));
  }

  evaluateReactiveValue<T = any>(reactive: ReactiveValue<T>): T {
    return this.evaluateExpression(reactive.expression, reactive.returnType);
  }

  evaluateComputedField(computed: ComputedField): any {
    return this.evaluateExpression(computed.formula, computed.returnType);
  }

  private evaluateExpression(
    expression: string,
    returnType: string = "string"
  ): any {
    let result: any = expression;

    // Replace {{field}}
    const fieldRegex = /\{\{([\w.]+)\}\}/g;

    result = result.replace(fieldRegex, (_: string, path: string) => {
      const val = get(this.values, path);

      if (typeof val === "string") {
        return `'${val.replace(/'/g, "\\'")}'`;
      }

      return val !== undefined && val !== null ? val : "null";
    });

    try {
      const helperNames = Object.keys(this.helpers);
      const helperValues = Object.values(this.helpers);

      const fn = new Function(
        ...helperNames,
        "data",
        `"use strict"; return (${result});`
      );

      const evaluated = fn(...helperValues, this.values);

      if (returnType === "boolean") return !!evaluated;
      if (returnType === "number") return Number(evaluated);

      return evaluated;
    } catch {
      console.debug("[ReactiveEngine] Evaluation error:", result);
    }

    if (returnType === "boolean") return result === "true";
    if (returnType === "number") return Number(result);

    return result;
  }
}
