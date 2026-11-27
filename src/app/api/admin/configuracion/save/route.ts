import { NextResponse, type NextRequest } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/supabase/server';
import { validateCsrfRequest } from '@/lib/security/csrf';
import { getWhatsAppConfig, updateWhatsAppAndNotificationConfig } from '@/services/config-service';

export async function POST(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
  }
  if (!validateCsrfRequest(request)) {
    return NextResponse.json({ success: false, error: 'Token Anti-CSRF inválido.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const ok = await updateWhatsAppAndNotificationConfig({
    phone: String(body.whatsapp_telefono || ''),
    message: String(body.whatsapp_mensaje || ''),
    tooltip: String(body.whatsapp_tooltip || ''),
    notificationEmail: String(body.notificacion_email || ''),
  });

  if (!ok) {
    return NextResponse.json({ success: false, error: 'Error al guardar la configuración.' }, { status: 500 });
  }

  const whatsapp = await getWhatsAppConfig();
  return NextResponse.json({
    success: true,
    data: {
      message: 'Configuración de WhatsApp guardada con éxito.',
      whatsapp,
    },
  });
}
