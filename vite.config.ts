import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Served from https://chezburgar.github.io/chezburgerpro/
export default defineConfig({
  base: "/chezburgerpro/",
  plugins: [react(), tailwindcss()],
});
