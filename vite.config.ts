import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages：預設部署於 https://<user>.github.io/OSCE_escape_room2026/
// 可透過環境變數 VITE_BASE 覆寫（例如自訂網域時設為 "/"）。
export default defineConfig({
  base: process.env.VITE_BASE ?? '/OSCE_escape_room2026/',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('@react-three') || id.includes('postprocessing')) return 'three-vendor';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});
