import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// En dev, l'API tourne sur :3000. Le proxy rend les appels same-origin
// (cookies de session fonctionnels sans CORS). En production, l'API sert
// directement le build de l'app sous /app (voir apps/api/src/app.ts).
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:3000', changeOrigin: false },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    css: false,
  },
});
