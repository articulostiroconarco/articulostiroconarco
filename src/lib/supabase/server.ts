import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getSupabaseEnv() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  return { url, anonKey, isConfigured: url !== '' && anonKey !== '' };
}

/**
 * Cliente público sin cookies apto para consultas cacheadas (ISR / unstable_cache)
 * e inserciones públicas anónimas (ej. formulario de contacto con RLS).
 */
export function createPublicSupabaseClient() {
  const { url, anonKey, isConfigured } = getSupabaseEnv();
  if (!isConfigured) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Cliente SSR autenticado mediante cookies HttpOnly seguras para /admin y API privada.
 */
export async function createServerSupabaseClient() {
  const { url, anonKey, isConfigured } = getSupabaseEnv();
  if (!isConfigured) {
    throw new Error('Las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY no están configuradas.');
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
            });
          }
        } catch {
          // Ignorar en Server Components de solo lectura (el middleware refresca la sesión)
        }
      },
    },
  });
}

/**
 * Obtiene el usuario administrador autenticado validando el JWT contra Supabase Auth.
 */
export async function getAuthenticatedAdmin() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return null;
    }
    if (data.user.is_anonymous) {
      return null;
    }
    return {
      id: data.user.id,
      email: data.user.email || 'Monitor',
    };
  } catch {
    return null;
  }
}
