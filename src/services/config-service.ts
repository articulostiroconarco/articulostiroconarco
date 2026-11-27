import { getConfigValue, upsertConfigValue } from '@/repositories/config-repository';
import type { WhatsAppConfig } from '@/types/domain';

export const DEFAULT_WHATSAPP_PHONE = '34600000000';
export const DEFAULT_WHATSAPP_MSG =
  'Hola Damià, he visto tu web y me gustaría informarme sobre las clases de tiro con arco en Mallorca.';
export const DEFAULT_WHATSAPP_TOOLTIP = '¿Dudas sobre clases en Mallorca?';
export const DEFAULT_NOTIF_EMAIL = 'damiajr@hotmail.com';

export function normalizeSpanishE164Phone(rawPhone: string): string {
  let clean = (rawPhone || '').replace(/\D/g, '');
  if (!clean) {
    clean = DEFAULT_WHATSAPP_PHONE;
  }
  if (clean.length === 9 && ['6', '7', '8', '9'].includes(clean[0])) {
    clean = `34${clean}`;
  }
  return clean;
}

export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  const [rawPhone, message, rawTooltip] = await Promise.all([
    getConfigValue('whatsapp_telefono', DEFAULT_WHATSAPP_PHONE),
    getConfigValue('whatsapp_mensaje', DEFAULT_WHATSAPP_MSG),
    getConfigValue('whatsapp_tooltip', DEFAULT_WHATSAPP_TOOLTIP),
  ]);

  let tooltip = rawTooltip.replace(/\s*¡?Escríbeme!?\s*$/iu, '').trim();
  if (!tooltip) {
    tooltip = DEFAULT_WHATSAPP_TOOLTIP;
  }

  const cleanPhone = normalizeSpanishE164Phone(rawPhone);
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;

  return {
    rawPhone,
    cleanPhone,
    message,
    encodedMessage,
    tooltip,
    url,
  };
}

export async function getNotificationEmail(): Promise<string> {
  const fallback = process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_NOTIF_EMAIL;
  return getConfigValue('notificacion_email', fallback);
}

export async function updateWhatsAppAndNotificationConfig(input: {
  phone: string;
  message: string;
  notificationEmail?: string;
  tooltip: string;
}): Promise<boolean> {
  const phone = input.phone.trim() || DEFAULT_WHATSAPP_PHONE;
  const message = input.message.trim() || DEFAULT_WHATSAPP_MSG;
  const tooltip =
    input.tooltip.replace(/\s*¡?Escríbeme!?\s*$/iu, '').trim() || DEFAULT_WHATSAPP_TOOLTIP;
  const notificationEmail = (input.notificationEmail || '').trim();

  const [okPhone, okMsg, okTooltip] = await Promise.all([
    upsertConfigValue(
      'whatsapp_telefono',
      phone,
      'Número de WhatsApp oficial con prefijo para el botón flotante'
    ),
    upsertConfigValue(
      'whatsapp_mensaje',
      message,
      'Mensaje inicial por defecto al abrir WhatsApp'
    ),
    upsertConfigValue(
      'whatsapp_tooltip',
      tooltip,
      'Texto base del globo emergente flotante sobre el botón de WhatsApp'
    ),
  ]);

  if (notificationEmail !== '') {
    await upsertConfigValue(
      'notificacion_email',
      notificationEmail,
      'Correo donde se reciben las alertas de nuevas consultas'
    );
  }

  return okPhone && okMsg && okTooltip;
}
