import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// /api and /media are proxied to Django so no CORS/URL setup is needed in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/media": "http://127.0.0.1:8000",
    },
  },
});
