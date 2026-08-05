/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      process.env.npm_package_version ||
      'dev'
    ),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          // React and the router are on the critical path but change rarely.
          // Splitting them out keeps them cached across app deploys and keeps
          // the entry chunk near its pre-React-19 size.
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id)) {
            return "react-vendor";
          }

          if (id.includes("@supabase")) {
            return "supabase-vendor";
          }

          if (id.includes("victory-vendor")) {
            return "charts-core-vendor";
          }

          if (id.includes("/lodash/") || id.includes("\\lodash\\")) {
            return "utility-vendor";
          }

          if (id.includes("recharts")) {
            return "charts-vendor";
          }

          return undefined;
        },
      },
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // Edge-function logic lives outside src/ but its pure core is plain
    // TS and worth covering here — it writes salary data on a schedule.
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "supabase/functions/**/*.{test,spec}.ts",
    ],
    // Keep tests deterministic across machines; avoid the "it works on my box" trap.
    clearMocks: true,
    restoreMocks: true,
  },
}));
