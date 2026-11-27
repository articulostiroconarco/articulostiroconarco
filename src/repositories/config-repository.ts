import { unstable_cache, revalidatePath, revalidateTag } from 'next/cache';
import { createPublicSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';

export const getCachedSiteConfigMap = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const supabase = createPublicSupabaseClient();
    if (!supabase) {
      return {};
    }

    const { data, error } = await supabase
      .from('configuracion_web')
      .select('clave, valor');

    if (error || !data) {
      return {};
    }

    const map: Record<string, string> = {};
    for (const row of data) {
      if (row.clave && typeof row.valor === 'string') {
        map[String(row.clave)] = row.valor;
      }
    }
    return map;
  },
  ['damia-site-config-v1'],
  { tags: ['site-config'], revalidate: 300 }
);

export async function getConfigValue(key: string, defaultValue = ''): Promise<string> {
  const map = await getCachedSiteConfigMap();
  return map[key] !== undefined ? map[key] : defaultValue;
}

export async function upsertConfigValue(
  key: string,
  value: string,
  descripcion = ''
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const payload: Record<string, unknown> = {
    clave: key,
    valor: value,
    updated_at: new Date().toISOString(),
  };
  if (descripcion !== '') {
    payload.descripcion = descripcion;
  }

  const { error } = await supabase
    .from('configuracion_web')
    .upsert(payload, { onConflict: 'clave' });

  if (error) {
    return false;
  }

  revalidateSiteConfigCache();
  return true;
}

export function revalidateSiteConfigCache(): void {
  try {
    revalidateTag('site-config');
    revalidatePath('/', 'layout');
    revalidatePath('/admin/configuracion');
  } catch {
    // Ignorar fuera de petición Next.js
  }
}
