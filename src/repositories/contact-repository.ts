import { createPublicSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import type { LeadRecord } from '@/types/domain';

/**
 * Inserta un nuevo lead desde el formulario público usando retorno mínimo (sin SELECT),
 * cumpliendo estrictamente la política RLS donde `anon` puede INSERT pero jamás SELECT sobre datos personales.
 */
export async function insertPublicContactLead(input: {
  nombre: string;
  email: string;
  telefono?: string;
  motivo: string;
  mensaje: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Base de datos Supabase no configurada.' };
  }

  const { error } = await supabase.from('leads_contacto').insert({
    nombre: input.nombre,
    email: input.email,
    telefono: input.telefono || '',
    motivo: input.motivo,
    mensaje: input.mensaje,
    leido: false,
    respondido: false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Consulta todos los leads (exclusivo para monitor autenticado mediante cookie SSR + RLS).
 */
export async function getAllLeadsAdmin(): Promise<LeadRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('leads_contacto')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as LeadRecord[];
}

export async function markLeadReadAdmin(id: string, leido: boolean): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('leads_contacto')
    .update({ leido })
    .eq('id', id);

  return !error;
}

export async function markLeadRespondedAdmin(id: string, respondido: boolean): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const payload: { respondido: boolean; leido?: boolean } = { respondido };
  if (respondido) {
    payload.leido = true;
  }

  const { error } = await supabase
    .from('leads_contacto')
    .update(payload)
    .eq('id', id);

  return !error;
}

export async function deleteLeadAdmin(id: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('leads_contacto')
    .delete()
    .eq('id', id);

  return !error;
}
