import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const repo = path.resolve(import.meta.dirname, "..");

export default defineConfig({
  plugins: [react()],
  root: path.resolve(import.meta.dirname),
  resolve: {
    alias: [
      { find: "@/contexts/AuthContext", replacement: path.resolve(import.meta.dirname, "mock-auth.tsx") },
      { find: "@", replacement: path.resolve(repo, "client", "src") },
      { find: "@shared", replacement: path.resolve(repo, "shared") },
      { find: "@assets", replacement: path.resolve(repo, "attached_assets") },
    ],
  },
  server: {
    port: 5098,
    proxy: { "/api": "http://localhost:5099" },
  },
});
