import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginClient } from '@/components/admin/LoginClient';
import { generateCsrfToken } from '@/lib/security/csrf';
import { getAuthenticatedAdmin } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Acceso al Panel Técnico',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const admin = await getAuthenticatedAdmin();
  if (admin) {
    redirect('/admin');
  }

  return <LoginClient csrfToken={generateCsrfToken()} />;
}
