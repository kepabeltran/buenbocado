import tsParser from "@typescript-eslint/parser";

export default [
  { ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**"] },
  {
    files: ["**/*.{js,cjs,mjs,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {},
  },
];
