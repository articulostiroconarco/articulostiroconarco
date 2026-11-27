import { NextResponse, type NextRequest } from 'next/server';
import { searchCatalogArticles } from '@/repositories/article-repository';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const level = searchParams.get('level') || '';

  const results = await searchCatalogArticles(q, category, level);
  const payload = results.map((a) => ({
    slug: a.slug,
    title: a.title,
    categoryKey: a.categoryKey,
    categoryName: a.categoryName,
    categoryRoman: a.categoryRoman,
    number: a.number,
    excerpt: a.excerpt,
    level: a.level,
    readTime: a.readTime,
    tags: a.tags,
  }));

  return NextResponse.json({
    success: true,
    data: {
      total: payload.length,
      articles: payload,
    },
  });
}
