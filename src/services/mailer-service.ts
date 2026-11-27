import { getNotificationEmail } from '@/services/config-service';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface ContactEmailPayload {
  nombre: string;
  email: string;
  telefono: string;
  tipoArco: string;
  modalidad: string;
  mensaje: string;
  fecha: string;
}

/**
 * Envío de notificaciones de contacto por HTTPS mediante Resend API (100% compatible con Vercel Serverless).
 * Si RESEND_API_KEY no está definida, retorna de forma segura sin interrumpir el registro en Supabase.
 */
export async function sendContactNotificationEmail(payload: ContactEmailPayload): Promise<boolean> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    return false;
  }

  const toEmail = await getNotificationEmail();
  const fromName = (process.env.MAIL_FROM_NAME || 'Artículos Tiro con Arco').trim();
  const fromAddress = (process.env.MAIL_FROM_ADDRESS || 'onboarding@resend.dev').trim();

  const safeNombre = escapeHtml(payload.nombre);
  const safeEmail = escapeHtml(payload.email);
  const safeTelefono = payload.telefono ? escapeHtml(payload.telefono) : 'No facilitado';
  const safeTipoArco = escapeHtml(payload.tipoArco);
  const safeModalidad = escapeHtml(payload.modalidad);
  const safeFecha = escapeHtml(payload.fecha);
  const safeMensaje = escapeHtml(payload.mensaje).replace(/\n/g, '<br />');

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Nueva Consulta de Asesoría</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; color: #1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: #002619; padding: 20px 24px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Nuevo mensaje de contacto recibido</h1>
        <p style="color: #D98218; margin: 4px 0 0 0; font-size: 13px;">Portal Artículos de Tiro con Arco</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px; margin-bottom: 20px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;"><td style="font-weight: 600; width: 140px;">Remitente:</td><td>${safeNombre}</td></tr>
          <tr style="border-bottom: 1px solid #e5e7eb;"><td style="font-weight: 600;">Email:</td><td><a href="mailto:${safeEmail}" style="color: #0A3D2C;">${safeEmail}</a></td></tr>
          <tr style="border-bottom: 1px solid #e5e7eb;"><td style="font-weight: 600;">Teléfono:</td><td>${safeTelefono}</td></tr>
          <tr style="border-bottom: 1px solid #e5e7eb;"><td style="font-weight: 600;">Tipo de Arco:</td><td>${safeTipoArco}</td></tr>
          <tr style="border-bottom: 1px solid #e5e7eb;"><td style="font-weight: 600;">Modalidad:</td><td>${safeModalidad}</td></tr>
          <tr><td style="font-weight: 600;">Fecha (Madrid):</td><td>${safeFecha}</td></tr>
        </table>
        <div style="background-color: #f8fafb; border-left: 4px solid #D98218; padding: 14px 16px; font-size: 14px; line-height: 1.6;">
          ${safeMensaje}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    'NUEVO MENSAJE DE CONTACTO RECIBIDO',
    `Fecha: ${payload.fecha}`,
    `Remitente: ${payload.nombre}`,
    `Email: ${payload.email}`,
    `Teléfono: ${payload.telefono || 'No facilitado'}`,
    `Tipo de Arco: ${payload.tipoArco}`,
    `Modalidad: ${payload.modalidad}`,
    '',
    'MENSAJE:',
    payload.mensaje,
  ].join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromAddress}>`,
        to: [toEmail],
        reply_to: payload.email,
        subject: `Nuevo mensaje de contacto: ${payload.nombre}`,
        html,
        text,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
