import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedAdmin } from '@/lib/supabase/server';
import { validateCsrfRequest } from '@/lib/security/csrf';
import { markLeadReadAdmin } from '@/repositories/contact-repository';

export async function POST(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
  }
  if (!validateCsrfRequest(request)) {
    return NextResponse.json({ success: false, error: 'Token Anti-CSRF inválido.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || '').trim();
  const leido = Boolean(body.leido);

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID de mensaje no proporcionado.' }, { status: 422 });
  }

  const ok = await markLeadReadAdmin(id, leido);
  if (!ok) {
    return NextResponse.json({ success: false, error: 'No se pudo actualizar el estado del mensaje.' }, { status: 500 });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/mensajes');
  return NextResponse.json({
    success: true,
    data: { message: leido ? 'Mensaje marcado como leído.' : 'Mensaje marcado como pendiente.' },
  });
}
