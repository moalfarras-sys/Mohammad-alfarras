import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "next-env.d.ts",
    "MOA/**",
    "legacy_static/**",
    "app-next/**",
    // Node-only build/generation scripts (CommonJS) — not part of the app bundle,
    // so the browser/TS ruleset (e.g. no-require-imports) must not apply to them.
    "scripts/**",
    "**/*.cjs",
  ]),
]);

export default eslintConfig;
