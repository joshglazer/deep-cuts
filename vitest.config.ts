import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    // Runs vi.clearAllMocks() before every test automatically — don't add a
    // per-file `beforeEach(() => vi.clearAllMocks())` for this, it's redundant.
    clearMocks: true,
    coverage: {
      provider: "v8",
      // json-summary/json feed the PR coverage-report comment posted in CI
      // (see .github/workflows/test.yml) — html/lcov stay for local/tooling use.
      reporter: ["text", "html", "lcov", "json-summary", "json"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Thin re-exports with no logic of their own to test — the
        // underlying Astryx components are covered upstream.
        "src/design/atoms/*.ts",
        "src/design/theme/**",
        "src/**/*.d.ts",
        // Static metadata/markup with no behavior to assert on.
        "src/app/layout.tsx",
        "src/app/opengraph-image.tsx",
        "src/app/manifest.ts",
        "src/test/**",
        // Amplify client wiring only (Amplify.configure + generateClient) —
        // no branch logic of its own, and importing it for real requires
        // amplify_outputs.json, which only exists after `npm run sandbox`.
        // Every caller mocks this module instead (see src/test/mockDataClient.ts).
        "src/lib/amplify-server.ts",
      ],
      // No global `thresholds` here on purpose — coverage is gated per-PR on
      // changed lines only (scripts/check-coverage-diff.mjs), not on the
      // whole repo's total. A global threshold would block every PR in this
      // stack until the entire app hit 80%, not just the code each PR adds.
    },
  },
});
