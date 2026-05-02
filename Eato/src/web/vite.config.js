import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Prevent copying `public/` images into `dist/` output.
    // (Your app will still use `/...` paths from `public/` while running in dev.)
    copyPublicDir: false,
  },
  server: { port: 3000, proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } } }
});
