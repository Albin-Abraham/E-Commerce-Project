/**
 * ZenOS Document Engine — Token Interpolation Resolver
 *
 * Resolves mustache-style `{{path.to.key}}` placeholders against:
 * 1. The Reserved Runtime Context ($document, $system, $page, etc.)
 * 2. Business Entity Data Context
 */

export function resolveTokenPath(obj: any, path: string): any {
  if (!obj || typeof obj !== "object") return undefined;
  const segments = path.trim().split(".");
  let current = obj;

  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    current = current[segment];
  }

  return current;
}

export function interpolateDocumentTokens(
  template: string,
  context: Record<string, any>
): string {
  if (!template || typeof template !== "string") return "";

  return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
    const trimmed = expression.trim();
    const resolved = resolveTokenPath(context, trimmed);

    if (resolved !== undefined && resolved !== null) {
      return String(resolved);
    }

    return match; // Retain token if unresolved
  });
}
