import type { Metadata } from 'next';
import { ConfigAdminClient } from '@/components/admin/ConfigAdminClient';
import { generateCsrfToken } from '@/lib/security/csrf';
import { getNotificationEmail, getWhatsAppConfig } from '@/services/config-service';

export const metadata: Metadata = {
  title: 'Ajustes de WhatsApp y Notificaciones — Panel Técnico',
  robots: { index: false, follow: false },
};

export default async function AdminConfigurationPage() {
  const [whatsapp, notifEmail] = await Promise.all([
    getWhatsAppConfig(),
    getNotificationEmail(),
  ]);

  return (
    <ConfigAdminClient
      whatsapp={whatsapp}
      notifEmail={notifEmail}
      csrfToken={generateCsrfToken()}
    />
  );
}
