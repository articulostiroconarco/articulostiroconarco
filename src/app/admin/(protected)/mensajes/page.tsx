import type { Metadata } from 'next';
import { MessagesAdminClient } from '@/components/admin/MessagesAdminClient';
import { generateCsrfToken } from '@/lib/security/csrf';
import { getAllLeadsAdmin } from '@/repositories/contact-repository';

export const metadata: Metadata = {
  title: 'Buzón de Consultas y Leads — Panel de Control',
  robots: { index: false, follow: false },
};

export default async function AdminMessagesPage() {
  const leads = await getAllLeadsAdmin();
  return <MessagesAdminClient leads={leads} csrfToken={generateCsrfToken()} />;
}
