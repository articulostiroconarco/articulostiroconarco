import { insertPublicContactLead } from '@/repositories/contact-repository';
import { sendContactNotificationEmail } from '@/services/mailer-service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitPublicContact(input: {
  nombre?: unknown;
  email?: unknown;
  telefono?: unknown;
  tipoArco?: unknown;
  modalidad?: unknown;
  mensaje?: unknown;
}): Promise<{
  success: boolean;
  message: string;
  errors: Record<string, string>;
}> {
  const errors: Record<string, string> = {};

  const nombre = String(input.nombre ?? '').trim();
  const email = String(input.email ?? '').trim();
  const telefono = String(input.telefono ?? '').trim();
  const tipoArco = String(input.tipoArco ?? '').trim() || 'No especificado';
  const modalidad = String(input.modalidad ?? '').trim() || 'Asesoría general';
  const mensaje = String(input.mensaje ?? '').trim();

  if (nombre.length < 2) {
    errors.nombre = 'Por favor, introduce tu nombre completo.';
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    errors.email = 'Introduce una dirección de correo electrónico válida.';
  }
  if (mensaje.length < 10) {
    errors.mensaje =
      'Por favor, describe brevemente tu consulta o punto técnico (mínimo 10 caracteres).';
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: 'Por favor, revisa los campos señalados.',
      errors,
    };
  }

  const motivo = `${tipoArco} - ${modalidad}`.trim();
  const saved = await insertPublicContactLead({
    nombre,
    email,
    telefono,
    motivo,
    mensaje,
  });

  if (!saved.success) {
    return {
      success: false,
      message: 'No se pudo guardar la solicitud en este momento. Inténtalo de nuevo.',
      errors: { general: saved.error || 'Error de persistencia en Supabase.' },
    };
  }

  const fechaMadrid = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date());

  // Notificación asíncrona por Resend API (no bloquea el éxito si no hay API key)
  await sendContactNotificationEmail({
    nombre,
    email,
    telefono,
    tipoArco,
    modalidad,
    mensaje,
    fecha: fechaMadrid,
  });

  return {
    success: true,
    message:
      '¡Consulta técnica recibida correctamente! Damiá Juan Ramis contactará contigo en un plazo de 24-48 horas laborables.',
    errors: {},
  };
}
