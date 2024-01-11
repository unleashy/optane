module.exports = {
  root: true,
  env: { browser: false, es2023: true },
  extends: [
    "eslint:recommended",
    "plugin:unicorn/recommended",
    "plugin:n/recommended",
    "plugin:@typescript-eslint/strict-type-checked",
    "prettier",
  ],
  plugins: ["@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  rules: {
    "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { fixStyle: "inline-type-imports" },
    ],
    "@typescript-eslint/no-unused-vars": "off",
    "n/no-missing-import": "off",
    "prefer-const": "off",
    "unicorn/consistent-function-scoping": "off",
    "unicorn/prefer-ternary": "off",
    "unicorn/prevent-abbreviations": "off",
  },
  overrides: [
    {
      extends: ["plugin:@typescript-eslint/disable-type-checked"],
      files: ["./**/*.js", "./**/*.cjs", "./**/*.mjs"],
    },
  ],
};
