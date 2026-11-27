import crypto from 'node:crypto';
import { unstable_cache, revalidatePath, revalidateTag } from 'next/cache';
import { createPublicSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { getAllCategoriesFromDb } from '@/repositories/category-repository';
import type { ArticleEntity, CategoryGroup, RawArticle, RawCategory } from '@/types/domain';

function toRoman(num: number): string {
  const map: Record<number, string> = {
    10: 'X',
    9: 'IX',
    8: 'VIII',
    7: 'VII',
    6: 'VI',
    5: 'V',
    4: 'IV',
    3: 'III',
    2: 'II',
    1: 'I',
  };
  return map[num] || 'I';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getDrivePreviewUrl(driveUrl: string | null | undefined): string | null {
  if (!driveUrl || !driveUrl.trim()) {
    return null;
  }
  const url = driveUrl.trim();
  const match = url.match(
    /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/(?:document|presentation|spreadsheets)\/d\/)([a-zA-Z0-9_-]+)/
  );
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  if (url.includes('drive.google.com') && url.includes('/view')) {
    return url.replace(/\/view(\?.*)?$/, '/preview');
  }
  return url;
}

export function getDriveDownloadUrl(driveUrl: string | null | undefined): string | null {
  if (!driveUrl || !driveUrl.trim()) {
    return null;
  }
  const url = driveUrl.trim();
  const match =
    url.match(
      /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*?id=)|docs\.google\.com\/(?:document|presentation|spreadsheets)\/d\/)([a-zA-Z0-9_-]+)/
    ) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
}

export async function getAllRawArticlesFromDb(): Promise<RawArticle[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('articulos')
    .select('*')
    .order('orden', { ascending: true })
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as RawArticle[];
}

function hydrateCatalog(rawCategories: RawCategory[], rawArticles: RawArticle[]): {
  categories: Record<string, CategoryGroup>;
  articlesBySlug: Record<string, ArticleEntity>;
  uniqueArticles: ArticleEntity[];
} {
  const categories: Record<string, CategoryGroup> = {};
  const articlesBySlug: Record<string, ArticleEntity> = {};
  const uniqueArticles: ArticleEntity[] = [];
  const catIdToKey: Record<string, string> = {};

  for (const cat of rawCategories) {
    const catId = String(cat.id || '');
    const catSlug = String(cat.slug || catId);
    catIdToKey[catId] = catSlug;
    const roman = toRoman(Number(cat.orden || 1));

    categories[catSlug] = {
      key: catSlug,
      id: catId,
      name: String(cat.titulo || ''),
      roman,
      description: String(cat.descripcion || cat.subtitulo || ''),
      icon: String(cat.icono || 'target'),
      articles: [],
    };
  }

  const sortedArticles = [...rawArticles].sort((a, b) => {
    const ordA = Number(a.orden ?? 1);
    const ordB = Number(b.orden ?? 1);
    if (ordA === ordB) {
      return String(a.id || '').localeCompare(String(b.id || ''));
    }
    return ordA - ordB;
  });

  const catCounters: Record<string, number> = {};

  for (const art of sortedArticles) {
    const catId = String(art.categoria_id || '');
    const catSlug = catIdToKey[catId] || 'otros';

    if (!categories[catSlug]) {
      categories[catSlug] = {
        key: catSlug,
        id: catId || 'otros',
        name: 'Otros Recursos',
        roman: 'VI',
        description: 'Artículos técnicos y documentación complementaria.',
        icon: 'library_books',
        articles: [],
      };
    }

    const catName = categories[catSlug].name;
    const catRoman = categories[catSlug].roman;
    catCounters[catSlug] = (catCounters[catSlug] || 0) + 1;
    const number = String(catCounters[catSlug]).padStart(2, '0');

    const rawId = String(art.id || '');
    const slug = rawId.replace(/^art-/, '') || rawId;
    const title = String(art.titulo || '');
    const subtitle = String(art.subtitulo || '');
    const excerpt = String(art.resumen || '');
    const author = String(art.autor || 'Damiá Juan Ramis');
    const fileType = art.tipo_archivo && String(art.tipo_archivo).trim() !== '' ? String(art.tipo_archivo).trim() : null;
    const driveUrl = art.drive_url && String(art.drive_url).trim() !== '' ? String(art.drive_url).trim() : null;
    const isFeatured = Boolean(art.destacado);
    const publishedAt = art.fecha ? String(art.fecha) : new Date().toISOString().slice(0, 10);

    const level = String(
      art.nivel || (fileType === 'GUIA' ? 'Avanzado' : isFeatured ? 'Intermedio' : 'Iniciación')
    );

    const contentHtml =
      '<div class="space-y-4">' +
      (subtitle !== ''
        ? `<p class="text-body-lg text-light-on-surface font-semibold">${escapeHtml(subtitle)}</p>`
        : '') +
      `<p class="text-body-md text-light-on-surface-variant leading-relaxed">${escapeHtml(excerpt)}</p>` +
      '</div>';

    const tags = [fileType || level, catName].filter(Boolean) as string[];

    const entity: ArticleEntity = {
      slug,
      dbId: rawId,
      title,
      subtitle,
      categoryKey: catSlug,
      categoryName: catName,
      categoryRoman: catRoman,
      number,
      excerpt,
      level,
      readTime: '',
      contentHtml,
      tags,
      isFeatured,
      publishedAt,
      driveUrl,
      drivePreviewUrl: getDrivePreviewUrl(driveUrl),
      driveDownloadUrl: getDriveDownloadUrl(driveUrl),
      fileType,
      author,
    };

    articlesBySlug[slug] = entity;
    if (rawId && rawId !== slug) {
      articlesBySlug[rawId] = entity;
    }
    uniqueArticles.push(entity);
    categories[catSlug].articles.push(entity);
  }

  return { categories, articlesBySlug, uniqueArticles };
}

/**
 * Catálogo cacheado en servidor Vercel (ISR / Data Cache) con revalidación por etiqueta 'catalog'.
 */
export const getCachedCatalog = unstable_cache(
  async () => {
    const [rawCategories, rawArticles] = await Promise.all([
      getAllCategoriesFromDb(),
      getAllRawArticlesFromDb(),
    ]);
    return hydrateCatalog(rawCategories, rawArticles);
  },
  ['damia-catalog-v1'],
  { tags: ['catalog'], revalidate: 120 }
);

export async function getFeaturedArticle(): Promise<ArticleEntity | null> {
  const { uniqueArticles } = await getCachedCatalog();
  return uniqueArticles.find((a) => a.isFeatured) || uniqueArticles[0] || null;
}

export async function findArticleBySlug(slug: string): Promise<ArticleEntity | null> {
  const { articlesBySlug } = await getCachedCatalog();
  const decoded = decodeURIComponent(slug);
  if (articlesBySlug[decoded]) return articlesBySlug[decoded];
  if (articlesBySlug[`art-${decoded}`]) return articlesBySlug[`art-${decoded}`];
  if (decoded.startsWith('art-')) {
    const clean = decoded.slice(4);
    if (articlesBySlug[clean]) return articlesBySlug[clean];
  }
  return null;
}

export async function getRelatedArticles(article: ArticleEntity, limit = 3): Promise<ArticleEntity[]> {
  const { categories } = await getCachedCatalog();
  const cat = categories[article.categoryKey];
  if (!cat) return [];
  return cat.articles.filter((a) => a.slug !== article.slug).slice(0, limit);
}

export async function searchCatalogArticles(query = '', category = '', level = ''): Promise<ArticleEntity[]> {
  const { uniqueArticles } = await getCachedCatalog();
  const q = query.trim().toLowerCase();
  const c = category.trim();
  const l = level.trim().toLowerCase();

  return uniqueArticles.filter((a) => {
    if (c !== '' && c !== 'all' && a.categoryKey !== c) return false;
    if (l !== '' && l !== 'all' && a.level.toLowerCase() !== l) return false;
    if (q === '') return true;
    const haystack = `${a.title} ${a.excerpt} ${a.subtitle} ${a.tags.join(' ')}`.toLowerCase();
    return haystack.includes(q);
  });
}

export function normalizeFileType(rawTipo: string | null | undefined): string | null {
  const trimmed = (rawTipo || '').trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  switch (upper) {
    case 'GUÍA':
    case 'GUIA':
      return 'GUIA';
    case 'VÍDEO':
    case 'VIDEO':
      return 'VIDEO';
    case 'FICHA':
    case 'FICHA TÉCNICA':
      return 'FICHA';
    case 'DOC':
    case 'DOCUMENTO':
      return 'DOC';
    case 'LINK':
    case 'ENLACE':
      return 'LINK';
    default:
      return upper;
  }
}

function slugifyId(title: string): string {
  const clean = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `art-${clean || 'articulo'}-${crypto.randomBytes(2).toString('hex')}`;
}

export async function createArticleInSupabase(input: {
  id?: string;
  categoria_id: string;
  titulo: string;
  subtitulo?: string;
  resumen?: string;
  autor?: string;
  fecha?: string;
  drive_url?: string | null;
  tipo_archivo?: string | null;
  destacado?: boolean;
  orden?: number;
}): Promise<{ success: boolean; data?: RawArticle; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const id = (input.id || '').trim() || slugifyId(input.titulo);

  const payload = {
    id,
    categoria_id: input.categoria_id.trim() || 'cat-1',
    titulo: input.titulo.trim(),
    subtitulo: (input.subtitulo || '').trim(),
    resumen: (input.resumen || '').trim(),
    autor: (input.autor || 'Damiá Juan Ramis').trim(),
    fecha: input.fecha && input.fecha.trim() !== '' ? input.fecha.trim() : new Date().toISOString().slice(0, 10),
    drive_url: input.drive_url && input.drive_url.trim() !== '' ? input.drive_url.trim() : null,
    tipo_archivo: normalizeFileType(input.tipo_archivo),
    destacado: Boolean(input.destacado),
    orden: Number(input.orden || 1),
  };

  const { data, error } = await supabase
    .from('articulos')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateCatalogCache();
  return { success: true, data: data as RawArticle };
}

export async function updateArticleInSupabase(
  id: string,
  input: {
    categoria_id?: string;
    titulo?: string;
    subtitulo?: string;
    resumen?: string;
    autor?: string;
    fecha?: string;
    drive_url?: string | null;
    tipo_archivo?: string | null;
    destacado?: boolean;
    orden?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const payload: Record<string, unknown> = {};

  if (input.categoria_id !== undefined) payload.categoria_id = input.categoria_id.trim();
  if (input.titulo !== undefined) payload.titulo = input.titulo.trim();
  if (input.subtitulo !== undefined) payload.subtitulo = input.subtitulo.trim();
  if (input.resumen !== undefined) payload.resumen = input.resumen.trim();
  if (input.autor !== undefined) payload.autor = input.autor.trim();
  if (input.fecha !== undefined) payload.fecha = input.fecha.trim();
  if (input.drive_url !== undefined) {
    payload.drive_url = input.drive_url && input.drive_url.trim() !== '' ? input.drive_url.trim() : null;
  }
  if (input.tipo_archivo !== undefined) {
    payload.tipo_archivo = normalizeFileType(input.tipo_archivo);
  }
  if (input.destacado !== undefined) payload.destacado = Boolean(input.destacado);
  if (input.orden !== undefined) payload.orden = Number(input.orden || 1);

  const { error } = await supabase.from('articulos').update(payload).eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateCatalogCache();
  return { success: true };
}

export async function deleteArticleInSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('articulos').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateCatalogCache();
  return { success: true };
}

export function revalidateCatalogCache(): void {
  try {
    revalidateTag('catalog');
    revalidatePath('/', 'layout');
    revalidatePath('/articulos');
    revalidatePath('/sitemap.xml');
  } catch {
    // Ignorar fuera de contexto de petición Next.js
  }
}
