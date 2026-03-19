import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react-core";
          }
          // React Router
          if (id.includes("node_modules/react-router") || id.includes("node_modules/@remix-run/")) {
            return "router";
          }
          // Supabase
          if (id.includes("node_modules/@supabase/")) {
            return "supabase";
          }
          // TanStack Query
          if (id.includes("node_modules/@tanstack/")) {
            return "tanstack-query";
          }
          // Radix UI primitives
          if (id.includes("node_modules/@radix-ui/")) {
            return "radix-ui";
          }
          // Framer Motion
          if (id.includes("node_modules/framer-motion")) {
            return "framer-motion";
          }
          // Recharts
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "charts";
          }
          // Lucide icons
          if (id.includes("node_modules/lucide-react")) {
            return "icons";
          }
          // Date utilities
          if (id.includes("node_modules/date-fns")) {
            return "date-fns";
          }
          // Zod + react-hook-form
          if (id.includes("node_modules/zod") || id.includes("node_modules/react-hook-form") || id.includes("node_modules/@hookform/")) {
            return "forms";
          }
          // Other UI libraries
          if (
            id.includes("node_modules/class-variance-authority") ||
            id.includes("node_modules/clsx") ||
            id.includes("node_modules/tailwind-merge") ||
            id.includes("node_modules/cmdk") ||
            id.includes("node_modules/vaul") ||
            id.includes("node_modules/sonner") ||
            id.includes("node_modules/embla-carousel") ||
            id.includes("node_modules/next-themes") ||
            id.includes("node_modules/input-otp") ||
            id.includes("node_modules/react-resizable-panels") ||
            id.includes("node_modules/react-day-picker") ||
            id.includes("node_modules/tailwindcss-animate")
          ) {
            return "ui-utils";
          }
        },
      },
    },
  },
}));
