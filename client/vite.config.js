import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react({ jsxImportSource: '@emotion/react' }), tailwindcss(),],
  optimizeDeps: {
    exclude: ['js-big-decimal']
  },
  base: '/Reynova-V3/'

});