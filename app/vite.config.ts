import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/agol/',
  plugins: [react()],
  server: {
    proxy: {
      '/agol/api': {
        target: 'http://localhost:8090',
        rewrite: (p) => p.replace(/^\/agol\/api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
