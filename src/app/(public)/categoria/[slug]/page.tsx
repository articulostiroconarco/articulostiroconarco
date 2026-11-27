import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CategoryFilterClient } from '@/components/public/CategoryFilterClient';
import { getCachedCatalog } from '@/repositories/article-repository';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { categories } = await getCachedCatalog();
  const cat = categories[decodeURIComponent(slug)];
  if (!cat) {
    return { title: 'Categoría no encontrada' };
  }
  return {
    title: `${cat.name} — Categoría completa`,
    description: cat.description,
    openGraph: {
      title: `${cat.roman} · ${cat.name} · Artículos de Tiro con Arco`,
      description: cat.description,
    },
  };
}

export default async function CategoryShowPage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const { categories } = await getCachedCatalog();
  const category = categories[decoded];

  if (!category) {
    redirect('/#portfolio');
  }

  const keys = Object.keys(categories);
  const idx = keys.indexOf(decoded);
  const nextKey = idx >= 0 && idx + 1 < keys.length ? keys[idx + 1] : null;
  const nextCategory = nextKey
    ? {
        key: nextKey,
        name: categories[nextKey].name,
        roman: categories[nextKey].roman,
      }
    : null;

  return <CategoryFilterClient category={category} nextCategory={nextCategory} />;
}
