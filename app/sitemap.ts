import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const routes: Array<{ path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }> = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/download', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/confidentialite', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/conditions', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/mentions-legales', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
