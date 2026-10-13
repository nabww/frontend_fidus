module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
  settings: { react: { version: "detect" } },
  rules: {
    "react/prop-types": "off",
    // Fetch-on-mount effects set loading state synchronously by design
    "react-hooks/set-state-in-effect": "off",
  },
  globals: {
    // vitest globals (tests run with globals: true)
    describe: "readonly",
    it: "readonly",
    test: "readonly",
    expect: "readonly",
    beforeAll: "readonly",
    afterAll: "readonly",
    beforeEach: "readonly",
    afterEach: "readonly",
    vi: "readonly",
  },
  ignorePatterns: ["node_modules/", "dist/"],
};
