import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import { compression } from "vite-plugin-compression2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration Maps ---

// CHUNK STRATEGY: "Granular Optimization"
// We split the massive visualization core into logic-grouped chunks (3D, Charts, Math)
// to reduce initial load time.
// Note: If circular dependency warnings return, we may need to merge specific groups back.

const CHUNK_GROUPS = {
  // 1. CORE (React + UI Libs + Interaction) - Merged to fix circular dependencies
  "vendor-core": [
    "/react/",
    "/react-dom/",
    "/react-router/",
    "/scheduler/",
    "/prop-types/",
    "/object-assign/",
    "/react-is/",
    "/hoist-non-react-statics/",
    "/invariant/",
    "framer-motion",
    "lucide-react",
    "@radix-ui",
    "i18next",
    "react-i18next",
    "sonner",
    "allotment",
    "@dnd-kit",
  ],

  // 2. PHYSICS ENGINE - Independent from visualization SCC, lazy loaded
  "vendor-physics": ["@react-three/cannon", "cannon-es"],

  // 3. PLOTLY - Heavy, isolated (extracted for performance)
  "vendor-plotly": ["plotly", "plotly.js-dist-min", "plotly.js"],

  // 5. DOMAIN-SPECIFIC VISUALIZATION CHUNKS
  "vendor-viz-3d": [
    "three",
    "@react-three",
    "three-stdlib",
    "three-csg-ts",
    "postprocessing",
    "ngl",
  ],
  "vendor-viz-math": [
    "katex",
    "mathjs",
    "nerdamer",
    "react-katex",
    "algebrite",
    "complex.js",
    "decimal.js",
  ],
  "vendor-viz-charts": [
    "d3",
    "chart.js",
    "react-chartjs-2",
    "function-plot",
    "mafs",
    "recharts",
  ],
  "vendor-viz-diagrams": [
    "cytoscape",
    "dagre",
    "graphlib",
    "reactflow",
    "mermaid",
    "hpcc-js",
  ],

  // 6. UI PRIMITIVES - Style utilities (no viz dependencies)
  "vendor-style": ["clsx", "cva", "tailwind-merge"],

  // 7. UTILITIES
  "vendor-tour": ["react-joyride", "intro.js"],
  "vendor-utils": ["react-syntax-highlighter", "firebase", "uuid"],
};

// --- Custom Plugins ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function criticalCssPlugin(): any {
  return {
    name: "critical-css",
    enforce: "post",
    apply: "build",
    async closeBundle() {
      try {
        const Critters = (await import("critters")).default;
        const critters = new Critters({
          path: "dist",
          publicPath: "/",
          preload: "js-lazy",
          inlineFonts: false,
          pruneSource: false,
          reduceInlineStyles: true,
          mergeStylesheets: true,
          compress: true,
          fonts: false,
          keyframes: "critical",
        });

        const htmlPath = path.resolve("dist", "index.html");
        // Check if file exists to prevent build crashes if output dir changes
        if (fs.existsSync(htmlPath)) {
          const html = fs.readFileSync(htmlPath, "utf-8");
          const processedHtml = await critters.process(html);
          fs.writeFileSync(htmlPath, processedHtml);
          console.log("[Critters] Critical CSS inlined successfully");
        } else {
          console.warn("[Critters] Skipped: index.html not found in dist");
        }
      } catch (err) {
        console.warn("[Critters] Warning:", err);
      }
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wasmContentTypePlugin(): any {
  return {
    name: "configure-response-headers",
    configureServer: (server) => {
      server.middlewares.use((req, res, next) => {
        if (req.url?.endsWith(".wasm")) {
          res.setHeader("Content-Type", "application/wasm");
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  loadEnv(mode, ".", "");

  return {
    server: {
      port: 3000,
      headers: {},
      proxy: {
        "/api/hf": {
          target: "https://router.huggingface.co",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/hf/, "/hf-inference"),
          secure: true,
        },
        "/api/somtoday": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
        // NIEUW: Proxy alle gemini calls naar je backend
        "/api/gemini": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
        "/api/benchmarks": {
          target: "http://127.0.0.1:3001",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    optimizeDeps: {
      exclude: ["sql.js"], // Prevent scanning sql.js which confuses vite with node deps
    },
    plugins: [
      react(),
      wasmContentTypePlugin(),
      // Combined compression to avoid running twice unnecessarily
      compression({
        algorithms: ["brotliCompress"],
        exclude: [/\.(br)$/, /\.(gz)$/], // Don't compress already compressed files
      }),
      compression({
        algorithms: ["gzip"],
        exclude: [/\.(br)$/, /\.(gz)$/],
      }),
      criticalCssPlugin(),
    ],
    define: {
      // SECURITY FIX: Removed process.env.API_KEY and GEMINI_API_KEY
      // Only expose what is safe for the public to see:
      "process.env.NODE_ENV": JSON.stringify(mode),
      global: "globalThis",
    },
    resolve: {
      dedupe: [
        "three",
        "postprocessing",
        "@react-three/fiber",
        "@react-three/drei",
        "@react-three/postprocessing",
      ],
      alias: [
        {
          find: "@vwo/shared-types",
          replacement: path.resolve(
            __dirname,
            "packages/shared-types/index.ts",
          ),
        },
        {
          find: "@vwo/business-logic",
          replacement: path.resolve(
            __dirname,
            "packages/business-logic/index.ts",
          ),
        },
        { find: "@app", replacement: path.resolve(__dirname, "./src/app") },
        { find: "@pages", replacement: path.resolve(__dirname, "./src/pages") },
        {
          find: "@widgets",
          replacement: path.resolve(__dirname, "./src/widgets"),
        },
        {
          find: "@features",
          replacement: path.resolve(__dirname, "./src/features"),
        },
        {
          find: "@entities",
          replacement: path.resolve(__dirname, "./src/entities"),
        },
        {
          find: "@shared",
          replacement: path.resolve(__dirname, "./src/shared"),
        },
        {
          find: "@services",
          replacement: path.resolve(__dirname, "./src/services"),
        },
        {
          find: "@stores",
          replacement: path.resolve(__dirname, "./src/stores"),
        },
        { find: "@data", replacement: path.resolve(__dirname, "./src/data") },
        {
          find: "@locales",
          replacement: path.resolve(__dirname, "./src/locales"),
        },
        { find: "@", replacement: path.resolve(__dirname, "./src") },

        {
          find: "function-plot",
          replacement: path.resolve(
            __dirname,
            "node_modules/function-plot/dist/function-plot.js",
          ),
        },
        {
          find: "sharp",
          replacement: path.resolve(__dirname, "./src/shared/lib/empty.ts"),
        },
        {
          find: "onnxruntime-node",
          replacement: path.resolve(__dirname, "./src/shared/lib/empty.ts"),
        },
        {
          find: "dprint-node",
          replacement: path.resolve(__dirname, "./src/shared/lib/empty.ts"),
        },
        {
          find: "fs",
          replacement: path.resolve(__dirname, "./src/shared/lib/empty.ts"),
        },
        {
          find: "path",
          replacement: path.resolve(__dirname, "./src/shared/lib/empty.ts"),
        },
        {
          find: "crypto",
          replacement: path.resolve(__dirname, "./src/shared/lib/empty.ts"),
        },
        {
          find: /^katex$/,
          replacement: path.resolve(
            __dirname,
            "node_modules/katex/dist/katex.mjs",
          ),
        },
      ],
    },
    build: {
      commonjsOptions: {
        ignore: ["fs", "path", "crypto"], // Suppress warnings for sql.js usage of node modules
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              // 1. RECHARTS ISOLATION (Fixes circular dependencies)
              if (
                id.includes("recharts") ||
                id.includes("react-smooth") ||
                id.includes("vicinity") ||
                id.includes("recharts-scale")
              ) {
                return "vendor-recharts";
              }

              // 2. Loop through other groups
              for (const [chunkName, moduleSignatures] of Object.entries(
                CHUNK_GROUPS,
              )) {
                if (
                  moduleSignatures.some((signature) => id.includes(signature))
                ) {
                  return chunkName;
                }
              }
              // CRITICAL FIX: Allow Vite to split remaining chunks automatically
              // to avoid circular dependencies (The "Catch-All" Trap)
              return null;
            }
          },
        },
        plugins: [
          visualizer({
            filename: "./dist/stats.html",
            gzipSize: true,
            brotliSize: true,
          }),
          {
            name: "override-sem-registry",
            transform(code, id) {
              if (id.includes("@iwer/sem") && id.includes("registry.js")) {
                return {
                  code: `
                      const fetchRoom = async (name) => {
                        try {
                          const response = await fetch(\`/rooms/\${name}.json\`);
                          const data = await response.json();
                          return { default: data };
                        } catch (e) {
                          console.error('Failed to load room:', name, e);
                          throw e;
                        }
                      };
                      export const Environments = {
                        living_room: () => fetchRoom('living_room'),
                        meeting_room: () => fetchRoom('meeting_room'),
                        music_room: () => fetchRoom('music_room'),
                        office_large: () => fetchRoom('office_large'),
                        office_small: () => fetchRoom('office_small'),
                      };
                    `,
                  map: null,
                };
              }
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        ],
        treeshake: {
          moduleSideEffects: false,
          preset: "recommended",
        },
      },
      chunkSizeWarningLimit: 2000,
      modulePreload: {
        polyfill: false,
        resolveDependencies(
          filename,
          deps,
          { hostId: _hostId, hostType: _hostType },
        ) {
          return deps.filter((dep) => {
            const heavyChunks = [
              "vendor-viz-3d",
              "vendor-viz-math",
              "vendor-viz-charts",
              "vendor-viz-diagrams",
              "vendor-plotly",
              "vendor-dnd",
              "vendor-tour",
            ];
            return !heavyChunks.some((chunkName) => dep.includes(chunkName));
          });
        },
      },
      minify: "esbuild",
      cssMinify: "esbuild",
      cssCodeSplit: true,
      sourcemap: true,
    },
  };
});
