import type { MetadataRoute } from 'next';
import { copy } from '@/content';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Charbon — Construis ta discipline',
    short_name: 'Charbon',
    description: copy.meta.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    lang: 'fr',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
