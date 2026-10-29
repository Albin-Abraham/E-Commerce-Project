import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../../ui/typography/Text";
import { Heading } from "../../ui/typography/Heading";
import { Code } from "../../ui/typography/Code";

const meta: Meta<typeof Text> = {
  title: "01 — Foundations / 🔤 Typography / Interactive Showcase",
  component: Text,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Interactive showcase of the ZenOS Typography system: type scale, semantic text styles, decoupled headings, text behaviors, and tabular numbers.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

/**
 * 1. The Controlled Type Scale Waterfall
 */
export const TypeScaleShowcase: Story = {
  render: () => (
    <div className="flex flex-col gap-6 max-w-4xl p-6 bg-surface rounded-xl border border-border shadow-sm">
      <div className="border-b border-border pb-4">
        <Text variant="label-sm" color="muted" className="uppercase tracking-widest">
          Type Scale Hierarchy
        </Text>
        <Text variant="body-sm" color="muted">
          From product statements down to microcopy and technical code.
        </Text>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3">
          <Text variant="display">Display Statement</Text>
          <Code>48px / Bold / Tight</Code>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3">
          <Text variant="heading-1">Heading 1: Major Title</Text>
          <Code>36px / Bold / Tight</Code>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3">
          <Text variant="heading-2">Heading 2: Section Level</Text>
          <Code>30px / Bold / Tight</Code>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3">
          <Text variant="heading-3">Heading 3: Subsection Header</Text>
          <Code>24px / Semibold / Snug</Code>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3">
          <Text variant="heading-4">Heading 4: Card & Panel Header</Text>
          <Code>20px / Semibold / Snug</Code>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3">
          <Text variant="body-lg">Body Large: Introductory lead paragraph text.</Text>
          <Code>18px / Regular / Relaxed</Code>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3">
          <Text variant="body-md">Body Medium: Primary interface reading copy.</Text>
          <Code>16px / Regular / Normal</Code>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3">
          <Text variant="body-sm">Body Small: Compact UI hints and secondary text.</Text>
          <Code>14px / Regular / Normal</Code>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3">
          <Text variant="label-lg">Label Large: Prominent control label</Text>
          <Code>16px / Medium / Snug</Code>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3">
          <Text variant="label-md">Label Medium: Standard form field label</Text>
          <Code>14px / Medium / Snug</Code>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3">
          <Text variant="label-sm">LABEL SMALL: UPPERCASE TAG & BADGE</Text>
          <Code>12px / Medium / Wide</Code>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3">
          <Text variant="caption">Caption: Supporting metadata and timestamp</Text>
          <Code>12px / Regular / Snug</Code>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <Text variant="code">const token = "typography.family.mono";</Text>
          <Code>14px / Mono / Normal</Code>
        </div>
      </div>
    </div>
  ),
};

/**
 * 2. Decoupled Semantic HTML & Visual Hierarchy
 */
export const DecoupledSemanticsDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-6 max-w-2xl p-6 bg-surface rounded-xl border border-border shadow-sm">
      <div>
        <Heading level={2} variant="heading-3">
          Semantic Decoupling in Action
        </Heading>
        <Text variant="body-sm" color="muted">
          Visual styling never dictates HTML document semantics. Here, an accessible &lt;h2&gt; is visually styled using the &lt;Heading level=&#123;2&#125; variant="heading-1"&gt; contract.
        </Text>
      </div>

      <div className="p-4 rounded-lg bg-subtle border border-border/60">
        <Heading level={2} variant="heading-1">
          Visual H1, Semantic H2
        </Heading>
        <Text variant="body-md" className="mt-2">
          Inspect this element: it renders as an <code>&lt;h2 role="heading" aria-level="2"&gt;</code> in the DOM tree, ensuring 100% heading order compliance without sacrificing visual weight.
        </Text>
      </div>
    </div>
  ),
};

/**
 * 3. Tabular vs Proportional Numerals
 */
export const TabularNumeralsDemo: Story = {
  render: () => {
    const [counter, setCounter] = useState(1000);

    useEffect(() => {
      const interval = setInterval(() => {
        setCounter((prev) => (prev >= 9999 ? 1000 : prev + 11));
      }, 100);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="flex flex-col gap-6 max-w-2xl p-6 bg-surface rounded-xl border border-border shadow-sm">
        <div>
          <Heading level={3} variant="heading-3">
            Tabular vs Proportional Numerals
          </Heading>
          <Text variant="body-sm" color="muted">
            Tabular numbers ensure uniform glyph widths, preventing layout jitter in financial tables and real-time counters.
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-subtle border border-border/60 flex flex-col items-center">
            <Text variant="label-sm" color="muted" className="mb-2">
              PROPORTIONAL (Jittery)
            </Text>
            <span className="text-3xl font-bold font-sans">
              ${(counter * 1.25).toFixed(2)}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-subtle border border-border/60 flex flex-col items-center">
            <Text variant="label-sm" color="muted" className="mb-2">
              TABULAR (Steady & Aligned)
            </Text>
            <Text variant="heading-2" tabularNums>
              ${(counter * 1.25).toFixed(2)}
            </Text>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * 4. Text Behavior (Wrapping, Truncation & Clamping)
 */
export const TextBehaviorPlayground: Story = {
  render: () => (
    <div className="flex flex-col gap-6 max-w-md p-6 bg-surface rounded-xl border border-border shadow-sm">
      <div>
        <Heading level={3} variant="heading-3">
          Text Behavior Engine
        </Heading>
        <Text variant="body-sm" color="muted">
          Predictable handling of wrapping, single-line ellipsis, and multi-line clamping.
        </Text>
      </div>

      <div className="flex flex-col gap-4">
        <div className="p-3 rounded bg-subtle border border-border/60">
          <Text variant="label-sm" color="muted" className="mb-1">
            Single-Line Truncation (`truncate=true`)
          </Text>
          <Text variant="body-md" truncate>
            ZenOS Enterprise Platform provides comprehensive cloud orchestration, automated deployment workflows, and granular security monitoring across all environments.
          </Text>
        </div>

        <div className="p-3 rounded bg-subtle border border-border/60">
          <Text variant="label-sm" color="muted" className="mb-1">
            2-Line Clamping (`truncate=2`)
          </Text>
          <Text variant="body-md" truncate={2}>
            ZenOS Enterprise Platform provides comprehensive cloud orchestration, automated deployment workflows, and granular security monitoring across all environments. This paragraph wraps naturally and clamps gracefully after two lines.
          </Text>
        </div>

        <div className="p-3 rounded bg-subtle border border-border/60">
          <Text variant="label-sm" color="muted" className="mb-1">
            Logical Alignment (`align="end"`)
          </Text>
          <Text variant="body-md" align="end">
            Aligned to the logical end of the reading flow.
          </Text>
        </div>
      </div>
    </div>
  ),
};
