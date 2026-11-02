import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// В режиме разработки запросы /api/* проксируются на локальный backend.
export default defineConfig({
  plugins: [react()],
  // Режим предпросмотра собранного сайта (используется на Render).
  preview: {
    host: "0.0.0.0",
    allowedHosts: [".onrender.com"],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
