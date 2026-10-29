/**
 * EXPRESSION EVALUATOR
 *
 * Safely evaluates conditional logic strings against the form data.
 * Used primarily for URL interpolation in RemoteOptions and condition evaluation.
 */

export class ExpressionEvaluator {
  /**
   * Evaluates a condition string against the provided data context.
   * @param expression The condition string (e.g., "data.age > 18")
   * @param context The data object (e.g., { age: 25 })
   */
  static evaluate(
    expression: string | boolean | undefined,
    context: any
  ): boolean {
    if (typeof expression === "boolean") return expression;
    if (!expression) return true;

    try {
      const func = new Function("data", `return ${expression}`);
      return !!func(context);
    } catch (error) {
      console.error(`Expression evaluation failed for: "${expression}"`, error);
      return false;
    }
  }

  /**
   * Interpolates a string with variables from data.
   * e.g. "Hello {user.name}" -> "Hello John"
   */
  static interpolate(template: string, data: any): string {
    if (!template) return "";
    return template.replace(
      /\{\{([^}]+)\}\}|\{([^}]+)\}/g,
      (_, doubleMatch, singleMatch) => {
        const path = (doubleMatch || singleMatch).trim();
        const value = ExpressionEvaluator.get(data, path);
        return value !== undefined && value !== null ? String(value) : "";
      }
    );
  }

  /**
   * Helper to deeply access object property by path string "user.name"
   */
  static get(obj: any, path: string) {
    if (!obj || !path) return undefined;
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  }
}
