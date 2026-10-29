import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import { expect } from "vitest";
import type { AccessibilityAssertionOptions } from "../types";

let matcherRegistered = false;

export function registerAccessibilityMatcher(): void {
  if (!matcherRegistered && typeof expect !== "undefined" && typeof expect.extend === "function") {
    expect.extend(matchers);
    matcherRegistered = true;
  }
}

export function setupAccessibilityMatchers(): void {
  registerAccessibilityMatcher();
}

export interface AxeResults {
  violations: AxeViolation[];
  passes: AxeCheck[];
  incomplete: AxeCheck[];
  inapplicable: AxeCheck[];
}

export interface AxeViolation {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNode[];
}

export interface AxeCheck {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical" | null;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNode[];
}

export interface AxeNode {
  any: AxeCheckResult[];
  all: AxeCheckResult[];
  none: AxeCheckResult[];
  impact: "minor" | "moderate" | "serious" | "critical" | null;
  html: string;
  target: string[];
  failureSummary?: string;
}

export interface AxeCheckResult {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical" | null;
  message: string;
  data: any;
  relatedNodes: AxeRelatedNode[];
}

export interface AxeRelatedNode {
  target: string[];
  html: string;
}

export async function expectAccessible(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<AxeResults> {
  const results = await axe(container, {
    rules: options.rules,
    runOnly: options.tags ? { type: "tag", values: options.tags } : undefined,
  });
  
  (expect(results) as any).toHaveNoViolations();
  
  return results as AxeResults;
}

export async function expectNoViolations(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<void> {
  await expectAccessible(container, options);
}

export async function expectNoCriticalViolations(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<void> {
  const results = await axe(container, options);
  
  const criticalViolations = results.violations.filter(v => v.impact === "critical");
  if (criticalViolations.length > 0) {
    const messages = criticalViolations.map(v => `${v.id}: ${v.description}`).join("\n");
    throw new Error(`Critical accessibility violations found:\n${messages}`);
  }
}

export async function expectNoSeriousViolations(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<void> {
  const results = await axe(container, options);
  
  const seriousViolations = results.violations.filter(v => v.impact === "serious" || v.impact === "critical");
  if (seriousViolations.length > 0) {
    const messages = seriousViolations.map(v => `${v.id}: ${v.description}`).join("\n");
    throw new Error(`Serious accessibility violations found:\n${messages}`);
  }
}

export async function getViolations(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<AxeViolation[]> {
  const results = await axe(container, options);
  return results.violations as unknown as AxeViolation[];
}

export async function getViolationsByImpact(
  container: HTMLElement,
  impact: "minor" | "moderate" | "serious" | "critical",
  options: AccessibilityAssertionOptions = {}
): Promise<AxeViolation[]> {
  const violations = await getViolations(container, options);
  return violations.filter(v => v.impact === impact);
}

export async function getViolationsByTag(
  container: HTMLElement,
  tag: string,
  options: AccessibilityAssertionOptions = {}
): Promise<AxeViolation[]> {
  const violations = await getViolations(container, options);
  return violations.filter(v => v.tags.includes(tag));
}

export async function expectKeyboardNavigable(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<void> {
  const violations = await getViolationsByTag(container, "keyboard", options);
  if (violations.length > 0) {
    const messages = violations.map(v => `${v.id}: ${v.description}`).join("\n");
    throw new Error(`Keyboard navigation violations found:\n${messages}`);
  }
}

export async function expectScreenReaderCompatible(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<void> {
  const violations = await getViolationsByTag(container, "screen-reader", options);
  if (violations.length > 0) {
    const messages = violations.map(v => `${v.id}: ${v.description}`).join("\n");
    throw new Error(`Screen reader compatibility violations found:\n${messages}`);
  }
}

export async function expectColorContrast(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<void> {
  const violations = await getViolationsByTag(container, "color-contrast", options);
  if (violations.length > 0) {
    const messages = violations.map(v => `${v.id}: ${v.description}`).join("\n");
    throw new Error(`Color contrast violations found:\n${messages}`);
  }
}

export async function expectFocusManagement(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<void> {
  const violations = await getViolationsByTag(container, "focus", options);
  if (violations.length > 0) {
    const messages = violations.map(v => `${v.id}: ${v.description}`).join("\n");
    throw new Error(`Focus management violations found:\n${messages}`);
  }
}

export async function expectAriaAttributes(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<void> {
  const violations = await getViolationsByTag(container, "aria", options);
  if (violations.length > 0) {
    const messages = violations.map(v => `${v.id}: ${v.description}`).join("\n");
    throw new Error(`ARIA attribute violations found:\n${messages}`);
  }
}

export async function expectFormLabels(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<void> {
  const violations = await getViolationsByTag(container, "forms", options);
  if (violations.length > 0) {
    const messages = violations.map(v => `${v.id}: ${v.description}`).join("\n");
    throw new Error(`Form label violations found:\n${messages}`);
  }
}

export async function expectTableAccessibility(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<void> {
  const violations = await getViolationsByTag(container, "table", options);
  if (violations.length > 0) {
    const messages = violations.map(v => `${v.id}: ${v.description}`).join("\n");
    throw new Error(`Table accessibility violations found:\n${messages}`);
  }
}

export async function expectHeadingStructure(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<void> {
  const violations = await getViolationsByTag(container, "heading", options);
  if (violations.length > 0) {
    const messages = violations.map(v => `${v.id}: ${v.description}`).join("\n");
    throw new Error(`Heading structure violations found:\n${messages}`);
  }
}

export function createAccessibilityReport(results: AxeResults): string {
  if (results.violations.length === 0) {
    return "✅ No accessibility violations found";
  }
  
  const byImpact = {
    critical: results.violations.filter(v => v.impact === "critical"),
    serious: results.violations.filter(v => v.impact === "serious"),
    moderate: results.violations.filter(v => v.impact === "moderate"),
    minor: results.violations.filter(v => v.impact === "minor"),
  };
  
  let report = `❌ Found ${results.violations.length} accessibility violation(s):\n\n`;
  
  for (const [impact, violations] of Object.entries(byImpact)) {
    if (violations.length === 0) continue;
    report += `## ${impact.toUpperCase()} (${violations.length})\n`;
    for (const violation of violations) {
      report += `- ${violation.id}: ${violation.description}\n`;
      report += `  Impact: ${violation.impact}, Tags: ${violation.tags.join(", ")}\n`;
      report += `  Help: ${violation.helpUrl}\n`;
      for (const node of violation.nodes) {
        report += `  Element: ${node.html}\n`;
      }
    }
    report += "\n";
  }
  
  return report;
}

export async function auditAndReport(
  container: HTMLElement,
  options: AccessibilityAssertionOptions = {}
): Promise<string> {
  const results = await axe(container, options);
  return createAccessibilityReport(results as AxeResults);
}