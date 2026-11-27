import crypto from 'node:crypto';
import { createPublicSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import type { RawCategory } from '@/types/domain';

const FALLBACK_CATEGORIES: RawCategory[] = [
  {
    id: 'cat-1',
    slug: 'tecnica-postura',
    titulo: 'Técnica y Postura',
    subtitulo: 'Biomecánica y alineación',
    descripcion: 'Biomecánica de la línea de tiro, alineación ósea y repetibilidad del ciclo de disparo.',
    icono: 'fitness_center',
    orden: 1,
  },
  {
    id: 'cat-2',
    slug: 'ajuste-material',
    titulo: 'Ajuste y Material',
    subtitulo: 'Puesta a punto milimétrica',
    descripcion: 'Puesta a punto milimétrica de flechas, palas, estabilización y cuerdas de alto rendimiento.',
    icono: 'tune',
    orden: 2,
  },
  {
    id: 'cat-3',
    slug: 'psicologia-enfoque',
    titulo: 'Psicología y Enfoque',
    subtitulo: 'Control mental y rutina',
    descripcion: 'Control de la atención, rutina pre-tiro y gestión de la presión en línea de competición.',
    icono: 'psychology',
    orden: 3,
  },
  {
    id: 'cat-4',
    slug: 'tiro-tradicional',
    titulo: 'Tiro Tradicional e Instintivo',
    subtitulo: 'Longbow y bosque 3D',
    descripcion: 'Longbow, recurvo tradicional y modalidades de bosque 3D sin visor ni estabilización artificial.',
    icono: 'forest',
    orden: 4,
  },
  {
    id: 'cat-5',
    slug: 'preparacion-fisica',
    titulo: 'Preparación Física',
    subtitulo: 'Acondicionamiento y SPT',
    descripcion: 'Acondicionamiento muscular preventivo, resistencia específica (SPT) y movilidad escapulotorácica.',
    icono: 'sports_gymnastics',
    orden: 5,
  },
];

export async function getAllCategoriesFromDb(): Promise<RawCategory[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return FALLBACK_CATEGORIES;
  }

  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('orden', { ascending: true });

  if (error || !data || data.length === 0) {
    return FALLBACK_CATEGORIES;
  }

  return data as RawCategory[];
}

export async function createCategoryInSupabase(input: {
  titulo: string;
  slug: string;
  subtitulo?: string;
  descripcion?: string;
  icono?: string;
  imagen_portada?: string;
  orden?: number;
}): Promise<{ success: boolean; data?: RawCategory; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const id = `cat-${crypto.randomBytes(4).toString('hex')}`;

  const payload = {
    id,
    slug: input.slug.trim(),
    titulo: input.titulo.trim(),
    subtitulo: (input.subtitulo || '').trim(),
    descripcion: (input.descripcion || '').trim(),
    icono: (input.icono || 'target').trim(),
    imagen_portada: (input.imagen_portada || '').trim(),
    orden: Number(input.orden || 1),
  };

  const { data, error } = await supabase
    .from('categorias')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as RawCategory };
}

export async function updateCategoryInSupabase(
  id: string,
  input: {
    titulo?: string;
    slug?: string;
    subtitulo?: string;
    descripcion?: string;
    icono?: string;
    imagen_portada?: string;
    orden?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const payload: Record<string, unknown> = {};

  if (input.titulo !== undefined) payload.titulo = input.titulo.trim();
  if (input.slug !== undefined) payload.slug = input.slug.trim();
  if (input.subtitulo !== undefined) payload.subtitulo = input.subtitulo.trim();
  if (input.descripcion !== undefined) payload.descripcion = input.descripcion.trim();
  if (input.icono !== undefined) payload.icono = input.icono.trim();
  if (input.imagen_portada !== undefined) payload.imagen_portada = input.imagen_portada.trim();
  if (input.orden !== undefined) payload.orden = Number(input.orden) || 1;

  const { error } = await supabase.from('categorias').update(payload).eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function deleteCategoryInSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('categorias').delete().eq('id', id);

  if (error) {
    return {
      success: false,
      error: error.code === '23503'
        ? 'No se puede eliminar la categoría porque tiene artículos asociados.'
        : error.message,
    };
  }
  return { success: true };
}
