import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.NODE_ENV !== "production"
      ? [
          runtimeErrorOverlay(),
          ...(process.env.REPL_ID !== undefined
            ? [
                await import("@replit/vite-plugin-cartographer").then((m) =>
                  m.cartographer()
                ),
              ]
            : []),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Alleen de pakketten zelf in een vaste vendor-chunk, niet hun
        // afhankelijkheden. Met de lijstvorm trok Rollup gedeelde kleine
        // pakketten (clsx, zod, radix-basis) mee in vendor-charts, -forms en
        // -ui, waardoor de homepage die hele chunks laadde (PageSpeed:
        // "niet-gebruikt JavaScript"). Al het andere deelt Rollup zelf op.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "vendor-react";
          if (/node_modules[\\/](recharts|recharts-scale|react-smooth|victory-vendor|d3-[^\\/]+)[\\/]/.test(id)) return "vendor-charts";
          if (/node_modules[\\/]framer-motion[\\/]/.test(id)) return "vendor-motion";
          if (/node_modules[\\/](react-hook-form|@hookform[\\/]resolvers)[\\/]/.test(id)) return "vendor-forms";
          return undefined;
        },
      },
    },
  },
});
