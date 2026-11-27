'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ManualModalButton } from '@/components/public/ManualModal';

interface Props {
  userEmail: string;
  children: React.ReactNode;
}

export function AdminShell({ userEmail, children }: Props) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Inicio', icon: 'dashboard', exact: true },
    { href: '/admin/categorias', label: 'Categorías', icon: 'category', exact: false },
    { href: '/admin/articulos', label: 'Artículos', icon: 'article', exact: false },
    { href: '/admin/mensajes', label: 'Buzón de Consultas', icon: 'inbox', exact: false },
    { href: '/admin/configuracion', label: 'WhatsApp y Ajustes', icon: 'settings', exact: false },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-light-background text-light-on-surface">
      <header className="bg-light-primary text-white border-b border-light-primary-container sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-white hover:text-gold-accent transition-colors"
            >
              <span className="material-symbols-outlined text-gold-accent text-2xl">sports_score</span>
              <span className="font-display text-xl tracking-tight font-bold uppercase">
                Gestión Técnica
              </span>
            </Link>
            <span className="hidden sm:inline-block text-xs font-mono bg-light-primary-container text-white/80 px-2.5 py-0.5 rounded-full border border-white/10">
              Panel del Monitor
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              <span>Ver Web Pública</span>
            </Link>
            <div className="h-4 w-px bg-white/20 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/80 hidden sm:inline">{userEmail}</span>
              <a
                href="/api/admin/logout"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-white/10 hover:bg-light-secondary hover:text-white text-white/90 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Salir</span>
              </a>
            </div>
          </div>
        </div>

        <nav className="bg-light-primary-container border-t border-white/10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex gap-1 sm:gap-2 overflow-x-auto py-1">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      <footer className="bg-white border-t border-light-outline-variant/40 py-4 px-4 text-center text-xs text-light-outline shrink-0 flex flex-wrap items-center justify-center gap-3">
        <span>Panel Técnico de Damià Juan Ramis — Sincronizado en tiempo real con Supabase</span>
        <span>•</span>
        <ManualModalButton variant="footer" />
      </footer>
    </div>
  );
}
