import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      reportsDirectory: "./src/__tests__/unit/coverage",
    },
  },
  plugins: [swc.vite()],
});
