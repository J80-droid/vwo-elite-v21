import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    globals: true,
    setupFiles: ["./tests/setup/electron-mock.ts"],
    alias: {
      electron: "./tests/setup/electron-mock.ts",
    },
  },
});
