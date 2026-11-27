import { NextResponse, type NextRequest } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/supabase/server';
import { validateCsrfRequest } from '@/lib/security/csrf';
import { deleteArticleInSupabase } from '@/repositories/article-repository';

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
    return NextResponse.json({ success: false, error: 'Identificador de artículo no especificado.' }, { status: 422 });
  }

  const res = await deleteArticleInSupabase(id);
  if (!res.success) {
    return NextResponse.json({ success: false, error: res.error || 'No se pudo eliminar el artículo.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: { message: 'Artículo eliminado correctamente de Supabase.' },
  });
}
