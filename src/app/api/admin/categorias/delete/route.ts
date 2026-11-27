import { NextResponse, type NextRequest } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/supabase/server';
import { validateCsrfRequest } from '@/lib/security/csrf';
import { revalidateCatalogCache } from '@/repositories/article-repository';
import { deleteCategoryInSupabase } from '@/repositories/category-repository';

export async function POST(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
  }

  if (!validateCsrfRequest(request)) {
    return NextResponse.json({ success: false, error: 'Token Anti-CSRF inválido o caducado.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || '').trim();
  if (!id) {
    return NextResponse.json({ success: false, error: 'Identificador de categoría no especificado.' }, { status: 422 });
  }

  const res = await deleteCategoryInSupabase(id);
  if (!res.success) {
    return NextResponse.json({ success: false, error: res.error || 'No se pudo eliminar la categoría.' }, { status: 500 });
  }

  revalidateCatalogCache();
  return NextResponse.json({
    success: true,
    data: { message: 'Categoría eliminada de Supabase.' },
  });
}
