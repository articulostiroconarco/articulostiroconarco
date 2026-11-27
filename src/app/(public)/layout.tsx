import { PublicFooter, PublicHeader } from '@/components/public/PublicShell';
import { getCachedCatalog } from '@/repositories/article-repository';
import { getWhatsAppConfig } from '@/services/config-service';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [whatsapp, { categories }] = await Promise.all([
    getWhatsAppConfig(),
    getCachedCatalog(),
  ]);

  return (
    <>
      <PublicHeader />
      <div className="flex-1 flex flex-col">{children}</div>
      <PublicFooter whatsapp={whatsapp} categories={Object.values(categories)} />
    </>
  );
}
