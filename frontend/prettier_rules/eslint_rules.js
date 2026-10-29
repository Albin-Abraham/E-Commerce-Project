/**
 * @file eslint_rules.js
 * @description Custom ESLint rule overrides for the project.
 *
 * These rules are consumed by the flat ESLint config (`eslint.config.js`)
 * and applied after the base `recommended` presets from `@eslint/js` and
 * `typescript-eslint`.
 *
 * ## Design Decisions
 * - **`react/prop-types: "off"`** — TypeScript's structural type system handles
 *   props validation at compile time, making runtime PropTypes redundant.
 * - **`react/display-name: "off"`** — `React.memo` and `React.lazy` arrow
 *   functions trigger this warning needlessly; named function expressions are
 *   used where debugging clarity matters.
 * - **`@typescript-eslint/no-explicit-any: "off"`** — The form engine schema
 *   layer handles heterogeneous field types where `any` is intentional (e.g.,
 *   `FormField<T = any>`). Strict `unknown` would cascade hundreds of casts.
 * - **`@typescript-eslint/no-unused-vars: "warn"`** — Warns (not errors) on
 *   unused variables so WIP code doesn't block the build. Prefix with `_` to
 *   acknowledge intentionally unused parameters.
 */
export const eslintRules = {
  // ── React ────────────────────────────────────────────────────────────
  "react/react-in-jsx-scope": "off",
  "react/prop-types": "off",
  "react/display-name": "off",
  "react/no-children-prop": "warn",

  // ── TypeScript ───────────────────────────────────────────────────────
  "@typescript-eslint/no-unused-vars": [
    "warn",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
    },
  ],
  "@typescript-eslint/no-explicit-any": "off",

  // ── Imports ──────────────────────────────────────────────────────────
  "no-undef": "off",
  "unused-imports/no-unused-imports": "warn",

  // ── Formatting ───────────────────────────────────────────────────────
  "prettier/prettier": "warn",

  // ── Naming Conventions ────────────────────────────────────────────────
  "@typescript-eslint/naming-convention": [
    "warn",
    {
      selector: "default",
      format: ["camelCase"],
      leadingUnderscore: "allow",
      trailingUnderscore: "allow",
    },
    {
      selector: "variable",
      format: ["camelCase", "UPPER_CASE", "PascalCase"],
      leadingUnderscore: "allow",
    },
    {
      selector: "typeLike",
      format: ["PascalCase"],
    },
    {
      selector: "interface",
      format: ["PascalCase"],
    },
    {
      selector: "objectLiteralProperty",
      format: null, // Allow any casing for API properties (e.g. snake_case keys in objects)
    },
  ],

  // ── ZenOS V2 Architectural Governance ──────────────────────────────────
  "import/no-restricted-paths": [
    "error",
    {
      basePath: "./src",
      zones: [
        // 1. Components (primitives) cannot import from repositories, services, or stores
        {
          target: "**/components/**/*.{ts,tsx}",
          from: "**/{services,stores,repository,store}/**/*.{ts,tsx}",
          message:
            "❌ Architectural Violation: Components cannot import repositories, services, or stores directly. Keep components purely presentation-focused.",
        },
        // 2. Services / Repositories cannot import React, UI, or page presenters
        {
          target: "**/{services,repository,store}/**/*.{ts,tsx}",
          from: "**/{components,pages,views,ui,router}/**/*.{ts,tsx}",
          message:
            "❌ Architectural Violation: Services & Repositories must remain pure data boundaries. No React, UI, or router imports allowed.",
        },
        // 3. Views / Presenters cannot import HTTP clients directly
        {
          target: "**/{views,pages,components}/**/*.{ts,tsx}",
          from: "core/http/**/*.{ts,tsx}",
          message:
            "❌ Architectural Violation: Presenters and Views cannot directly import the HTTP client. Use repositories or queries instead.",
        },
      ],
    },
  ],
};
