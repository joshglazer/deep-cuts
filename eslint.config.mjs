import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".amplify/**",
  ]),
  // Astryx components may only be imported inside src/design; everywhere
  // else must go through the branded wrappers exported from there.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/design/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@astryxdesign/*", "@astryxdesign/**"],
              message:
                "Import astryx components via the design system in src/design instead of importing @astryxdesign/* directly.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
