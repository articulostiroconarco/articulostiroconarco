import type { Metadata } from 'next';
import { CategoriesAdminClient } from '@/components/admin/CategoriesAdminClient';
import { generateCsrfToken } from '@/lib/security/csrf';
import { getAllCategoriesFromDb } from '@/repositories/category-repository';

export const metadata: Metadata = {
  title: 'Gestión de Categorías — Panel de Control',
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const categories = await getAllCategoriesFromDb();
  return <CategoriesAdminClient categories={categories} csrfToken={generateCsrfToken()} />;
}
