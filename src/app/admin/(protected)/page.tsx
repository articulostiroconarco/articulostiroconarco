import type { Metadata } from 'next';
import Link from 'next/link';
import { getAuthenticatedAdmin } from '@/lib/supabase/server';
import { getAllRawArticlesFromDb } from '@/repositories/article-repository';
import { getAllCategoriesFromDb } from '@/repositories/category-repository';
import { getAllLeadsAdmin } from '@/repositories/contact-repository';

export const metadata: Metadata = {
  title: 'Panel de Control del Monitor',
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const [admin, articles, categories, leads] = await Promise.all([
    getAuthenticatedAdmin(),
    getAllRawArticlesFromDb(),
    getAllCategoriesFromDb(),
    getAllLeadsAdmin(),
  ]);

  const unreadLeads = leads.filter((l) => !l.leido).length;
  const totalRespondedLeads = leads.filter((l) => l.respondido).length;
  const recentLeads = leads.slice(0, 5);
  const recentArticles = articles.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-lg border border-light-outline-variant/50 shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-light-primary uppercase">
            Panel del Monitor
          </h1>
          <p className="text-sm text-light-outline mt-1">
            Bienvenido, <span className="font-semibold text-light-on-surface">{admin?.email}</span>.
            Administra tu catálogo técnico y atiende las solicitudes de tus alumnos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/articulos"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-light-primary text-white text-xs font-semibold hover:bg-light-primary-container transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span>Nuevo Artículo</span>
          </Link>
          <Link
            href="/admin/mensajes"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-gold-accent text-white text-xs font-semibold hover:bg-gold-accent/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">mail</span>
            <span>Ver Buzón ({unreadLeads})</span>
          </Link>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-light-outline-variant/50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-light-outline">
              Categorías Activas
            </p>
            <p className="text-3xl font-bold font-display text-light-primary mt-1">
              {categories.length}
            </p>
            <Link
              href="/admin/categorias"
              className="text-xs text-gold-accent hover:underline mt-2 inline-block font-medium"
            >
              Ver categorías →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-full bg-light-surface-container-low flex items-center justify-center text-light-primary">
            <span className="material-symbols-outlined text-2xl">category</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-light-outline-variant/50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-light-outline">
              Artículos en Supabase
            </p>
            <p className="text-3xl font-bold font-display text-light-primary mt-1">
              {articles.length}
            </p>
            <Link
              href="/admin/articulos"
              className="text-xs text-gold-accent hover:underline mt-2 inline-block font-medium"
            >
              Gestionar catálogo →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-full bg-light-surface-container-low flex items-center justify-center text-light-primary">
            <span className="material-symbols-outlined text-2xl">menu_book</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-light-outline-variant/50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-light-outline">
              Consultas Sin Leer
            </p>
            <p
              className={`text-3xl font-bold font-display mt-1 ${
                unreadLeads > 0 ? 'text-light-secondary' : 'text-light-primary'
              }`}
            >
              {unreadLeads}
            </p>
            <Link
              href="/admin/mensajes"
              className="text-xs text-gold-accent hover:underline mt-2 inline-block font-medium"
            >
              Abrir buzón →
            </Link>
          </div>
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              unreadLeads > 0
                ? 'bg-red-50 text-light-secondary'
                : 'bg-light-surface-container-low text-light-primary'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">mark_email_unread</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-light-outline-variant/50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-light-outline">
              Mensajes Respondidos
            </p>
            <p className="text-3xl font-bold font-display text-light-primary mt-1">
              {totalRespondedLeads}
            </p>
            <Link
              href="/admin/mensajes"
              className="text-xs text-gold-accent hover:underline mt-2 inline-block font-medium"
            >
              Ver en buzón →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-full bg-light-surface-container-low flex items-center justify-center text-light-primary">
            <span className="material-symbols-outlined text-2xl">mark_chat_read</span>
          </div>
        </div>
      </div>

      {/* Últimos mensajes y artículos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-light-outline-variant/50 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-light-outline-variant/40 flex items-center justify-between bg-light-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gold-accent">inbox</span>
              <h2 className="font-display text-xl font-bold text-light-primary uppercase">
                Últimos Mensajes Recibidos
              </h2>
            </div>
            <Link
              href="/admin/mensajes"
              className="text-xs font-medium text-light-primary hover:text-gold-accent"
            >
              Ver todos ({leads.length}) →
            </Link>
          </div>

          <div className="p-4 flex-1">
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-light-outline text-sm">
                <span className="material-symbols-outlined text-3xl mb-1 opacity-50">drafts</span>
                <p>No hay mensajes en el buzón todavía.</p>
              </div>
            ) : (
              <div className="divide-y divide-light-outline-variant/40">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-light-on-surface">
                          {lead.nombre || 'Anónimo'}
                        </span>
                        {!lead.leido && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-light-secondary text-white uppercase">
                            Nuevo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-light-outline mt-0.5">
                        {lead.email} • <span className="font-mono">{lead.motivo || 'Consulta'}</span>
                      </p>
                      <p className="text-xs text-light-on-surface/80 mt-1 line-clamp-1 italic">
                        &ldquo;{lead.mensaje}&rdquo;
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-light-outline shrink-0">
                      {(lead.created_at || '').slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-light-outline-variant/50 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-light-outline-variant/40 flex items-center justify-between bg-light-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gold-accent">article</span>
              <h2 className="font-display text-xl font-bold text-light-primary uppercase">
                Artículos en Supabase
              </h2>
            </div>
            <Link
              href="/admin/articulos"
              className="text-xs font-medium text-light-primary hover:text-gold-accent"
            >
              Gestionar todos →
            </Link>
          </div>

          <div className="p-4 flex-1">
            {recentArticles.length === 0 ? (
              <div className="text-center py-8 text-light-outline text-sm">
                <span className="material-symbols-outlined text-3xl mb-1 opacity-50">post_add</span>
                <p>No se encontraron artículos en Supabase.</p>
              </div>
            ) : (
              <div className="divide-y divide-light-outline-variant/40">
                {recentArticles.map((art) => (
                  <div key={art.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-light-on-surface">{art.titulo}</h3>
                        {art.destacado && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Destacado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-light-outline mt-0.5">
                        {art.subtitulo || art.autor}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-light-outline shrink-0">
                      {art.fecha}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
