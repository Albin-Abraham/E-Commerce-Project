export interface ExpressionContext {
  values: Record<string, any>;
  user?: { id?: string; name?: string; role?: string; roles?: string[] };
  context?: Record<string, any>;
}

export interface ExpressionEngineConfig {
  /** Allowlisted function names. Default: safe built-ins. */
  allowedFunctions: ReadonlyArray<string>;
  /** Maximum expression evaluation depth (nested ternaries, logical ops). Default: 10 */
  maxDepth: number;
  /** Maximum evaluation time in ms. Default: 50 */
  maxEvaluationTimeMs: number;
  /** Whether to throw on disallowed function or return undefined. Default: true (throw) */
  strictMode: boolean;
  /** Custom function handlers. Key = function name. */
  customFunctions: Record<string, (arg: string, ctx: ExpressionContext) => any>;
}

/** Default secure configuration */
export const DEFAULT_EXPRESSION_CONFIG: ExpressionEngineConfig = {
  allowedFunctions: ["today", "sum", "uppercase", "lowercase", "currency", "hasrole"],
  maxDepth: 10,
  maxEvaluationTimeMs: 50,
  strictMode: true,
  customFunctions: {},
};

/**
 * Security violation types for detailed error reporting
 */
export class ExpressionSecurityError extends Error {
  public readonly code: string;
  public readonly expression: string;

  constructor(code: string, message: string, expression: string) {
    super(message);
    this.name = "ExpressionSecurityError";
    this.code = code;
    this.expression = expression;
  }
}

export class ExpressionEvaluationError extends Error {
  public readonly expression: string;
  public readonly cause?: Error;

  constructor(message: string, expression: string, cause?: Error) {
    super(message);
    this.name = "ExpressionEvaluationError";
    this.expression = expression;
    this.cause = cause;
  }
}

/**
 * Hardened Expression Engine
 *
 * Security features:
 * - Allowlisted functions only (no arbitrary code execution)
 * - Maximum evaluation depth to prevent DoS
 * - Maximum evaluation time to prevent hanging
 * - No eval(), Function(), or dynamic code execution
 * - No access to globals (window, process, globalThis, require, import)
 * - Strict mode throws on violations
 * - Custom functions must be explicitly registered
 */
export class ExpressionEngine {
  private readonly config: ExpressionEngineConfig;
  private readonly functionHandlers: Map<string, (arg: string, ctx: ExpressionContext) => any>;

  constructor(config: Partial<ExpressionEngineConfig> = {}) {
    this.config = { ...DEFAULT_EXPRESSION_CONFIG, ...config };
    this.functionHandlers = new Map();

    // Register built-in handlers
    for (const fn of this.config.allowedFunctions) {
      const handler = this.getBuiltinHandler(fn);
      if (handler) this.functionHandlers.set(fn.toLowerCase(), handler);
    }

    // Register custom functions (validated at registration)
    for (const [name, handler] of Object.entries(this.config.customFunctions)) {
      if (this.config.allowedFunctions.includes(name)) {
        this.functionHandlers.set(name.toLowerCase(), handler);
      } else if (this.config.strictMode) {
        throw new ExpressionSecurityError(
          "CUSTOM_FUNCTION_NOT_ALLOWLISTED",
          `Custom function '${name}' must be in allowedFunctions list`,
          name
        );
      }
    }
  }

  /**
   * Creates engine from IR security settings
   */
  static fromIRSecuritySettings(settings: {
    allowedExpressionFunctions: ReadonlyArray<string>;
    maxExpressionDepth: number;
  }): ExpressionEngine {
    return new ExpressionEngine({
      allowedFunctions: settings.allowedExpressionFunctions,
      maxDepth: settings.maxExpressionDepth,
    });
  }

  /**
   * Interpolates template strings containing `${expression}`.
   * e.g. "Invoice #${invoice.number}" -> "Invoice #INV-1001"
   */
  public interpolate(template: string, ctx: ExpressionContext): string {
    if (!template || typeof template !== "string") return template;

    const startTime = Date.now();
    let depth = 0;

    const result = template.replace(/\$\{([^}]+)\}/g, (_, expr) => {
      // Check depth for nested interpolations
      depth++;
      if (depth > this.config.maxDepth) {
        throw new ExpressionSecurityError(
          "MAX_DEPTH_EXCEEDED",
          `Template interpolation exceeds max depth of ${this.config.maxDepth}`,
          expr
        );
      }

      const trimmed = expr.trim();
      const val = this.evaluate(trimmed, ctx);
      depth--;
      return val !== undefined && val !== null ? String(val) : "";
    });

    // Check total evaluation time
    const elapsed = Date.now() - startTime;
    if (elapsed > this.config.maxEvaluationTimeMs) {
      throw new ExpressionSecurityError(
        "EVALUATION_TIMEOUT",
        `Template interpolation exceeded ${this.config.maxEvaluationTimeMs}ms`,
        template
      );
    }

    return result;
  }

  /**
   * Evaluates a single string expression against context.
   * Throws ExpressionSecurityError on security violations.
   * Throws ExpressionEvaluationError on runtime errors.
   */
  public evaluate(expression: string, ctx: ExpressionContext): any {
    if (!expression) return undefined;
    const expr = expression.trim();

    const startTime = Date.now();
    this.checkExpressionSecurity(expr);

    try {
      const result = this.evaluateInternal(expr, ctx, 0);

      // Check evaluation time
      const elapsed = Date.now() - startTime;
      if (elapsed > this.config.maxEvaluationTimeMs) {
        throw new ExpressionSecurityError(
          "EVALUATION_TIMEOUT",
          `Expression evaluation exceeded ${this.config.maxEvaluationTimeMs}ms`,
          expr
        );
      }

      return result;
    } catch (error) {
      if (error instanceof ExpressionSecurityError) throw error;
      throw new ExpressionEvaluationError(
        `Expression evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
        expr,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validates expression for security violations without evaluating.
   * Used by IR Validator at compile time.
   */
  public static validateExpression(
    expression: string,
    allowedFunctions: ReadonlyArray<string> = DEFAULT_EXPRESSION_CONFIG.allowedFunctions,
    maxDepth: number = DEFAULT_EXPRESSION_CONFIG.maxDepth
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!expression) return { valid: true, errors: [] };
    const expr = expression.trim();

    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /\beval\s*\(/, code: "EVAL_DETECTED", message: "eval() is not allowed" },
      { pattern: /\bFunction\s*\(/, code: "FUNCTION_CONSTRUCTOR_DETECTED", message: "Function constructor is not allowed" },
      { pattern: /\brequire\s*\(/, code: "REQUIRE_DETECTED", message: "require() is not allowed" },
      { pattern: /\bimport\s*\(/, code: "DYNAMIC_IMPORT_DETECTED", message: "Dynamic import is not allowed" },
      { pattern: /\bprocess\.env\b/, code: "PROCESS_ENV_DETECTED", message: "process.env access is not allowed" },
      { pattern: /\bglobalThis\b/, code: "GLOBAL_THIS_DETECTED", message: "globalThis access is not allowed" },
      { pattern: /\bwindow\b/, code: "WINDOW_DETECTED", message: "window access is not allowed" },
      { pattern: /\bdocument\b/, code: "DOCUMENT_DETECTED", message: "document access is not allowed" },
      { pattern: /\blocalStorage\b/, code: "LOCAL_STORAGE_DETECTED", message: "localStorage access is not allowed" },
      { pattern: /\bsessionStorage\b/, code: "SESSION_STORAGE_DETECTED", message: "sessionStorage access is not allowed" },
      { pattern: /\bindexedDB\b/, code: "INDEXED_DB_DETECTED", message: "indexedDB access is not allowed" },
      { pattern: /\bfetch\s*\(/, code: "FETCH_DETECTED", message: "fetch() is not allowed in expressions" },
      { pattern: /\bXMLHttpRequest\b/, code: "XHR_DETECTED", message: "XMLHttpRequest is not allowed" },
      { pattern: /\bWebSocket\b/, code: "WEBSOCKET_DETECTED", message: "WebSocket is not allowed" },
      { pattern: /\bsetTimeout\s*\(/, code: "SET_TIMEOUT_DETECTED", message: "setTimeout is not allowed" },
      { pattern: /\bsetInterval\s*\(/, code: "SET_INTERVAL_DETECTED", message: "setInterval is not allowed" },
      { pattern: /__proto__/, code: "PROTO_POLLUTION_DETECTED", message: "__proto__ access is not allowed" },
      { pattern: /constructor\.prototype/, code: "PROTOTYPE_POLLUTION_DETECTED", message: "Prototype manipulation is not allowed" },
      { pattern: /Object\.(defineProperty|setPrototypeOf|assign|create|freeze|seal)/, code: "OBJECT_MANIPULATION_DETECTED", message: "Object manipulation is not allowed" },
      { pattern: /Reflect\./, code: "REFLECT_DETECTED", message: "Reflect API is not allowed" },
      { pattern: /Proxy\s*\(/, code: "PROXY_DETECTED", message: "Proxy is not allowed" },
    ];

    for (const { pattern, code, message } of dangerousPatterns) {
      if (pattern.test(expr)) {
        errors.push(`${code}: ${message}`);
      }
    }

    // Check function calls against allowlist
    const fnCalls = expr.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g) || [];
    for (const fnCall of fnCalls) {
      const fnName = fnCall.replace(/\s*\($/, "").toLowerCase();
      if (!allowedFunctions.includes(fnName)) {
        errors.push(`DISALLOWED_FUNCTION: Function '${fnName}' is not in allowlist`);
      }
    }

    // Check expression depth (nested ternaries, logical ops)
    const depth = this.calculateExpressionDepth(expr);
    if (depth > maxDepth) {
      errors.push(`MAX_DEPTH_EXCEEDED: Expression depth ${depth} exceeds maximum ${maxDepth}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Calculates expression complexity depth
   */
  private static calculateExpressionDepth(expr: string): number {
    // Count ternary operators, logical operators as depth indicators
    const ternaryCount = (expr.match(/\?/g) || []).length;
    const logicalCount = (expr.match(/\|\||&&/g) || []).length;
    const comparisonCount = (expr.match(/===|!==|==|!=|>=|<=|>|</g) || []).length;
    return ternaryCount + logicalCount + Math.floor(comparisonCount / 2);
  }

  /**
   * Internal evaluation with depth tracking
   */
  private evaluateInternal(expr: string, ctx: ExpressionContext, currentDepth: number): any {
    if (currentDepth > this.config.maxDepth) {
      throw new ExpressionSecurityError(
        "MAX_DEPTH_EXCEEDED",
        `Expression evaluation depth exceeded ${this.config.maxDepth}`,
        expr
      );
    }

    // 1. Function helper check: e.g. sum(items), today(), uppercase(name), currency(amount)
    const fnMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*)\)$/);
    if (fnMatch) {
      const fnName = fnMatch[1].toLowerCase();
      const rawArg = fnMatch[2].trim();

      // Verify function is allowlisted
      if (!this.functionHandlers.has(fnName)) {
        if (this.config.strictMode) {
          throw new ExpressionSecurityError(
            "DISALLOWED_FUNCTION",
            `Function '${fnName}' is not allowed`,
            expr
          );
        }
        return undefined;
      }

      const handler = this.functionHandlers.get(fnName)!;
      return handler(rawArg, ctx);
    }

    // 2. Comparison expressions: e.g., "total > 1000", "status === 'Approved'"
    const compMatch = expr.match(/^(.+?)\s*(===|==|!==|!=|>=|<=|>|<)\s*(.+)$/);
    if (compMatch) {
      const left = this.evaluateInternal(compMatch[1].trim(), ctx, currentDepth + 1);
      const op = compMatch[2];
      const rightRaw = compMatch[3].trim();
      const right = this.parseLiteral(rightRaw, ctx);
      return this.compare(left, op, right);
    }

    // 3. Logical expressions: "a && b", "a || b", "!a"
    const logicalMatch = expr.match(/^(.+?)\s*(&&|\|\|)\s*(.+)$/);
    if (logicalMatch) {
      const left = this.evaluateInternal(logicalMatch[1].trim(), ctx, currentDepth + 1);
      const op = logicalMatch[2];
      const right = this.evaluateInternal(logicalMatch[3].trim(), ctx, currentDepth + 1);
      return op === "&&" ? (left && right) : (left || right);
    }

    // 4. Negation: "!a"
    if (expr.startsWith("!")) {
      const val = this.evaluateInternal(expr.slice(1).trim(), ctx, currentDepth + 1);
      return !val;
    }

    // 5. Ternary: "a ? b : c"
    const ternaryMatch = expr.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/);
    if (ternaryMatch) {
      const condition = this.evaluateInternal(ternaryMatch[1].trim(), ctx, currentDepth + 1);
      const trueBranch = this.evaluateInternal(ternaryMatch[2].trim(), ctx, currentDepth + 1);
      const falseBranch = this.evaluateInternal(ternaryMatch[3].trim(), ctx, currentDepth + 1);
      return condition ? trueBranch : falseBranch;
    }

    // 6. Simple path lookup e.g. "customer.name" or "user.role"
    return this.getValueByPath(expr, ctx);
  }

  private checkExpressionSecurity(expr: string): void {
    const validation = ExpressionEngine.validateExpression(expr, this.config.allowedFunctions, this.config.maxDepth);
    if (!validation.valid) {
      throw new ExpressionSecurityError(
        validation.errors[0].split(":")[0],
        validation.errors.join("; "),
        expr
      );
    }
  }

  private getBuiltinHandler(fnName: string): ((arg: string, ctx: ExpressionContext) => any) | null {
    switch (fnName.toLowerCase()) {
      case "today":
        return () => new Date().toISOString().split("T")[0];

      case "sum": {
        return (argPath: string, ctx: ExpressionContext) => {
          const val = this.getValueByPath(argPath, ctx);
          if (Array.isArray(val)) {
            return val.reduce((acc, item) => acc + (Number(item) || 0), 0);
          }
          return Number(val) || 0;
        };
      }

      case "uppercase": {
        return (argPath: string, ctx: ExpressionContext) => {
          const val = this.getValueByPath(argPath, ctx);
          return typeof val === "string" ? val.toUpperCase() : val;
        };
      }

      case "lowercase": {
        return (argPath: string, ctx: ExpressionContext) => {
          const val = this.getValueByPath(argPath, ctx);
          return typeof val === "string" ? val.toLowerCase() : val;
        };
      }

      case "currency": {
        return (argPath: string, ctx: ExpressionContext) => {
          const val = Number(this.getValueByPath(argPath, ctx)) || 0;
          return `$${val.toFixed(2)}`;
        };
      }

      case "hasrole": {
        return (argPath: string, ctx: ExpressionContext) => {
          const roleName = argPath.replace(/['"]/g, "");
          const userRoles = ctx.user?.roles || (ctx.user?.role ? [ctx.user.role] : []);
          return userRoles.includes(roleName);
        };
      }

      default:
        return null;
    }
  }

  private parseLiteral(raw: string, ctx: ExpressionContext): any {
    if (raw === "true") return true;
    if (raw === "false") return false;
    if (raw === "null") return null;
    if (raw === "undefined") return undefined;

    // String literal
    if (
      (raw.startsWith("'") && raw.endsWith("'")) ||
      (raw.startsWith('"') && raw.endsWith('"'))
    ) {
      return raw.slice(1, -1);
    }

    // Numeric literal
    if (!isNaN(Number(raw))) {
      return Number(raw);
    }

    // Path evaluation
    return this.getValueByPath(raw, ctx);
  }

  private compare(left: any, op: string, right: any): boolean {
    switch (op) {
      case "===":
      case "==":
        return left == right;
      case "!==":
      case "!=":
        return left != right;
      case ">":
        return Number(left) > Number(right);
      case ">=":
        return Number(left) >= Number(right);
      case "<":
        return Number(left) < Number(right);
      case "<=":
        return Number(left) <= Number(right);
      default:
        return false;
    }
  }

  private getValueByPath(path: string, ctx: ExpressionContext): any {
    if (!path) return undefined;
    const parts = path.split(".");

    let target: any = ctx.values;
    if (parts[0] === "user") {
      target = ctx.user;
      parts.shift();
    } else if (parts[0] === "context") {
      target = ctx.context;
      parts.shift();
    }

    for (const part of parts) {
      if (target === null || target === undefined) return undefined;
      target = target[part];
    }
    return target;
  }
}