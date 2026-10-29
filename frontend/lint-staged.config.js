export default {
  // Lint & format TypeScript / TSX files
  "**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],

  // Format JSON, Markdown, and other config files
  "**/*.{json,md,css,scss,html}": ["prettier --write"],
};
