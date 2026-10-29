// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import storybook from "eslint-plugin-storybook";
import unusedImports from "eslint-plugin-unused-imports";
import testingLibrary from "eslint-plugin-testing-library";
import jestDom from "eslint-plugin-jest-dom";
import globals from "globals";
import tseslint from "typescript-eslint";

import { eslintRules } from "./prettier_rules/eslint_rules.js";

const testingLibraryPlugin = testingLibrary;
const jestDomPlugin = jestDom.default;

const testingLibraryReactRules = {
  "testing-library/await-async-utils": "error",
  "testing-library/no-await-sync-queries": "error",
  "testing-library/no-debugging-utils": "warn",
  "testing-library/no-dom-import": "error",
  "testing-library/no-render-in-lifecycle": "error",
  "testing-library/no-unnecessary-act": "error",
  "testing-library/no-wait-for-multiple-assertions": "error",
  "testing-library/no-wait-for-side-effects": "error",
  "testing-library/prefer-explicit-assert": "warn",
  "testing-library/prefer-find-by": "warn",
  "testing-library/prefer-implicit-assert": "warn",
  "testing-library/prefer-presence-queries": "warn",
  "testing-library/prefer-screen-queries": "warn",
  "testing-library/prefer-user-event": "error",
  "testing-library/render-result-naming-convention": "warn",
  "testing-library/no-await-sync-events": "error",
  "testing-library/no-container": "error",
  "testing-library/no-node-access": "error",
  "testing-library/no-promise-in-fire-event": "error",
  "testing-library/no-test-id-queries": "warn",
  "testing-library/no-wait-for-snapshot": "warn",
  "testing-library/prefer-query-by-disappearance": "warn",
  "testing-library/prefer-query-matchers": "warn",
  "testing-library/prefer-user-event-setup": "warn",
};

const jestDomRecommendedRules = {
  "jest-dom/prefer-checked": "warn",
  "jest-dom/prefer-enabled-disabled": "warn",
  "jest-dom/prefer-focus": "warn",
  "jest-dom/prefer-in-document": "warn",
  "jest-dom/prefer-required": "warn",
  "jest-dom/prefer-to-have-attribute": "warn",
  "jest-dom/prefer-to-have-class": "warn",
  "jest-dom/prefer-to-have-style": "warn",
  "jest-dom/prefer-to-have-text-content": "warn",
  "jest-dom/prefer-to-have-value": "warn",
};

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
      "unused-imports": unusedImports,
      import: importPlugin,
      prettier: prettierPlugin,
      "testing-library": testingLibraryPlugin,
      "jest-dom": jestDomPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      ...testingLibraryReactRules,
      ...jestDomRecommendedRules,
      ...eslintRules,
      ...prettierConfig.rules,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["src/shared/testing/capabilities/**/*.ts", "src/shared/testing/capabilities/**/*.tsx"],
    plugins: {
      import: importPlugin,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../queries/**", "../interactions/**", "../assertions/**", "../async/**", "../diagnostics/**"],
              message: "Cross-capability imports are forbidden. Import from the capability's index.ts only.",
            },
          ],
        },
      ],
      "import/no-internal-modules": [
        "error",
        {
          allow: ["**/index.ts"],
        },
      ],
    },
  },
  {
    files: ["src/shared/testing/drivers/*.ts", "src/shared/testing/drivers/*.tsx"],
    plugins: {
      import: importPlugin,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../BaseDriver"],
              message: "Direct inheritance from BaseDriver is deprecated. Use capability composition instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["e2e/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "build/**",
      "coverage/**",
      "scripts/**",
      "**/*.config.js",
      "temp_*/**",
      "**/temp_*/**",
      "public/**",
      "apps/**",
      "stats.html",
    ],
  },
  storybook.configs["flat/recommended"]
);