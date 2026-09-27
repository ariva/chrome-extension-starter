// Test runner config — deliberately separate from vite.config.ts (that one builds the
// extension; tests import sources directly and must not inherit its root/plugins).
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node", // UI tests bring their own happy-dom Window
          include: ["tests/**/*.test.ts"],
          exclude: ["tests/browser/**"], // real-browser tier: vitest.browser.config.ts
        },
      },
    ],
  },
});
