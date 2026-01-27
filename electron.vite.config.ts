import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { dirname, resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sharedAlias = {
  "@vwo/shared-types": resolve(__dirname, "packages/shared-types/index.ts"),
  "@vwo/business-logic": resolve(__dirname, "packages/business-logic/index.ts"),
  "@shared": resolve(__dirname, "src/shared"),
  "@features": resolve(__dirname, "src/features"),
  "@entities": resolve(__dirname, "src/entities"),
  "@services": resolve(__dirname, "src/services"),
  "@stores": resolve(__dirname, "src/stores"),
  "@widgets": resolve(__dirname, "src/widgets"),
  "@pages": resolve(__dirname, "src/pages"),
  "@locales": resolve(__dirname, "src/locales"),
  "@app": resolve(__dirname, "src/app"),
  "@data": resolve(__dirname, "src/data"),
  "@": resolve(__dirname, "src"),
};

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ["@vwo/shared-types", "@vwo/business-logic"],
      }),
    ],
    build: {
      rollupOptions: {
        external: [
          "better-sqlite3",
          "vectordb",
          "lance",
          "@lancedb/lancedb",
          "pdf-parse",
          "sharp",
          "apache-arrow",
        ],
      },
      lib: {
        entry: "apps/main/src/index.ts",
      },
    },
    resolve: {
      alias: sharedAlias,
    },
  },
  preload: {
    // Bundle workspace packages in preload too
    plugins: [
      externalizeDepsPlugin({
        exclude: ["@vwo/shared-types", "@vwo/business-logic"],
      }),
    ],
    build: {
      lib: {
        entry: "apps/preload/index.ts",
      },
    },
    resolve: {
      alias: sharedAlias,
    },
  },
  renderer: {
    root: ".",
    build: {
      rollupOptions: {
        input: resolve("index.html"),
      },
    },
    plugins: [
      react(),
      visualizer({
        emitFile: true,
        filename: "stats.html",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    ],
    resolve: {
      alias: {
        ...sharedAlias,
        "@renderer": resolve(__dirname, "src"),
      },
    },
  },
});
