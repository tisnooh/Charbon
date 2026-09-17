import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Site vitrine statique multi-pages (MPA). Le HTML est servi tel quel :
// bon pour le SEO, aucune dépendance à un framework côté client.
// Le proxy /api permet au formulaire de contact de fonctionner en dev.
export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        privacy: fileURLToPath(new URL('./privacy.html', import.meta.url)),
        terms: fileURLToPath(new URL('./terms.html', import.meta.url)),
        contact: fileURLToPath(new URL('./contact.html', import.meta.url)),
      },
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:3000', changeOrigin: false },
    },
  },
});
