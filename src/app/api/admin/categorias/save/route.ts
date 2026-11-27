import { NextResponse, type NextRequest } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/supabase/server';
import { validateCsrfRequest } from '@/lib/security/csrf';
import { revalidateCatalogCache } from '@/repositories/article-repository';
import { createCategoryInSupabase, updateCategoryInSupabase } from '@/repositories/category-repository';

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
  const titulo = String(body.titulo || '').trim();
  let slug = String(body.slug || '').trim();

  if (!titulo) {
    return NextResponse.json({ success: false, error: 'El título de la categoría es obligatorio.' }, { status: 422 });
  }

  if (!slug) {
    slug = titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  const payload = {
    titulo,
    slug,
    subtitulo: String(body.subtitulo || ''),
    descripcion: String(body.descripcion || ''),
    icono: String(body.icono || 'target'),
    orden: Number(body.orden || 1),
  };

  if (id) {
    const res = await updateCategoryInSupabase(id, payload);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error || 'No se pudo actualizar la categoría.' }, { status: 500 });
    }
    revalidateCatalogCache();
    return NextResponse.json({
      success: true,
      data: { message: 'Categoría actualizada correctamente en Supabase.' },
    });
  }

  const created = await createCategoryInSupabase(payload);
  if (!created.success) {
    return NextResponse.json({ success: false, error: created.error || 'Error al crear la categoría.' }, { status: 500 });
  }

  revalidateCatalogCache();
  return NextResponse.json({
    success: true,
    data: { message: 'Categoría creada correctamente en Supabase.', data: created.data },
  });
}
