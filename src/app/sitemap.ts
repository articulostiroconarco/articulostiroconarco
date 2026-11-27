import type { MetadataRoute } from 'next';
import { getCachedCatalog } from '@/repositories/article-repository';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://damia-tiroconarco.vercel.app').replace(
    /\/$/,
    ''
  );
  const { categories, uniqueArticles } = await getCachedCatalog();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/cuaderno-tiro`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];

  const categoryEntries: MetadataRoute.Sitemap = Object.values(categories).map((cat) => ({
    url: `${siteUrl}/categoria/${encodeURIComponent(cat.key)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const articleEntries: MetadataRoute.Sitemap = uniqueArticles.map((art) => ({
    url: `${siteUrl}/articulo/${encodeURIComponent(art.slug)}`,
    lastModified: art.publishedAt ? new Date(art.publishedAt) : new Date(),
    changeFrequency: 'monthly',
    priority: art.isFeatured ? 0.85 : 0.7,
  }));

  return [...staticEntries, ...categoryEntries, ...articleEntries];
}
