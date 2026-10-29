import { importOrderRules } from "./prettier_rules/import_rules.js";

export default {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "auto", // Fixes CRLF ␍ errors across Windows/Linux/Mac

  // --- Import Sorting Rules ---
  plugins: ["@trivago/prettier-plugin-sort-imports"],

  // Define what order directories should appear in:
  importOrder: importOrderRules,

  // Separation settings
  importOrderSeparation: true, // Adds a blank line between the groups above
  importOrderSortSpecifiers: true, // Alphabetically sorts the destructuring: import { B, A } -> import { A, B }
};
