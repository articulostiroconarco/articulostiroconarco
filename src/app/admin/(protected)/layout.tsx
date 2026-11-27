import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { getAuthenticatedAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect('/admin/login');
  }

  return <AdminShell userEmail={admin.email}>{children}</AdminShell>;
}
