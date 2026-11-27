import type { Metadata } from 'next';
import { ArticlesAdminClient } from '@/components/admin/ArticlesAdminClient';
import { generateCsrfToken } from '@/lib/security/csrf';
import { getAllRawArticlesFromDb } from '@/repositories/article-repository';
import { getAllCategoriesFromDb } from '@/repositories/category-repository';

export const metadata: Metadata = {
  title: 'Gestión de Artículos — Panel de Control',
  robots: { index: false, follow: false },
};

export default async function AdminArticlesPage() {
  const [articles, categories] = await Promise.all([
    getAllRawArticlesFromDb(),
    getAllCategoriesFromDb(),
  ]);

  return (
    <ArticlesAdminClient
      articles={articles}
      categories={categories}
      csrfToken={generateCsrfToken()}
    />
  );
}
