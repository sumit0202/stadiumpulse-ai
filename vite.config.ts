import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the StadiumPulse AI web client.
// The Express proxy runs on PORT (default 8787) and is reached through /api.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2021',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
  },
});
