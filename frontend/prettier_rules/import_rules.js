// Defines the architectural directory sorting order for Prettier.
// Aligned with vite.config.ts aliases.
export const importOrderRules = [
  "^react(.*)$",
  "<THIRD_PARTY_MODULES>",

  // 1. Foundation & Configuration
  "^@/app/(.*)$",
  "^@/core/(.*)$",
  "^@configs/(.*)$",
  "^@constants/(.*)$",
  "^@routes/(.*)$",

  // 2. Business Logic & State
  "^@services/(.*)$",
  "^@stores/(.*)$",
  "^@contexts/(.*)$",
  "^@domain/(.*)$",

  // 3. UI Components & Features
  "^@pages/(.*)$",
  "^@features/(.*)$",
  "^@shop/(.*)$",
  "^@components/(.*)$",

  // 4. Utilities & Shared
  "^@shared/(.*)$",
  "^@hooks/(.*)$",
  "^@utils/(.*)$",
  "^@libs/(.*)$",
  "^@debug/(.*)$",

  // 5. Assets & Styles
  "^@styles/(.*)$",
  "^@assets/(.*)$",

  // 6. Generic Aliases
  "^@/(.*)$",

  // 7. Relative imports (../, ./)
  "^[./]",
];
