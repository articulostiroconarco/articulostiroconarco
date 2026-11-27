import { NextResponse, type NextRequest } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/supabase/server';
import { validateCsrfRequest } from '@/lib/security/csrf';
import { createArticleInSupabase, updateArticleInSupabase } from '@/repositories/article-repository';

export async function POST(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Cuerpo JSON no válido.' }, { status: 400 });
  }

  if (!validateCsrfRequest(request)) {
    return NextResponse.json({ success: false, error: 'Token Anti-CSRF inválido o caducado.' }, { status: 403 });
  }

  const id = String(body.id || '').trim();
  const titulo = String(body.titulo || '').trim();
  const categoria_id = String(body.categoria_id || '').trim();

  if (!titulo) {
    return NextResponse.json({ success: false, error: 'El título del artículo es obligatorio.' }, { status: 422 });
  }

  const payload = {
    categoria_id,
    titulo,
    subtitulo: String(body.subtitulo || ''),
    resumen: String(body.resumen || ''),
    autor: String(body.autor || 'Damiá Juan Ramis'),
    fecha: String(body.fecha || new Date().toISOString().slice(0, 10)),
    drive_url: body.drive_url ? String(body.drive_url) : null,
    tipo_archivo: body.tipo_archivo ? String(body.tipo_archivo) : null,
    destacado: Boolean(body.destacado),
    orden: Number(body.orden || 1),
  };

  if (id) {
    const res = await updateArticleInSupabase(id, payload);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error || 'No se pudo actualizar el artículo.' }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      data: { message: 'Artículo actualizado correctamente en Supabase.' },
    });
  }

  const created = await createArticleInSupabase(payload);
  if (!created.success) {
    return NextResponse.json({ success: false, error: created.error || 'Error al crear el artículo.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: { message: 'Artículo publicado correctamente en Supabase.', data: created.data },
  });
}
