import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [".loca.lt", ".trycloudflare.com", "localhost", "127.0.0.1", "10.51.19.73"],
  },
  build: {
    rollupOptions: {
      input: {
        showcase: "index.html",
        react: "react.html",
      },
    },
  },
});
