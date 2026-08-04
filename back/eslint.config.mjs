import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", "eslint.config.mjs", "drizzle.config.ts"],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  prettier,

  {
    files: ["**/*.ts"],

    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },

      globals: globals.node,
    },

    rules: {
      eqeqeq: "error",
      curly: "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "off",

      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",

      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
);
