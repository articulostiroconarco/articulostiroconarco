'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ManualModalButton } from '@/components/public/ManualModal';
import type { CategoryGroup, WhatsAppConfig } from '@/types/domain';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = pathname === '/' || pathname === '/articulos';
  const isCuaderno = pathname === '/cuaderno-tiro';

  const portfolioHref = isHome ? '#portfolio' : '/#portfolio';
  const monitorHref = isHome ? '#monitor' : '/#monitor';
  const contactHref = isHome ? '#contact' : '/#contact';

  return (
    <header
      id="mainNav"
      className="fixed top-0 inset-x-0 z-40 transition-colors duration-150 bg-light-surface/95 backdrop-blur-md border-b border-light-outline-variant/60 print:hidden"
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-3 text-light-on-surface hover:text-light-primary transition-colors"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            className="shrink-0 text-light-primary"
          >
            <path
              d="M6 22C11.5 16.5 11.5 11.5 6 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <line x1="6" y1="6" x2="6" y2="22" stroke="#D98218" strokeWidth="1.4" />
            <line
              x1="4"
              y1="14"
              x2="23"
              y2="14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M19.5 10.5L23.5 14L19.5 17.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-headline text-headline-sm tracking-tight text-light-on-surface whitespace-nowrap">
            Artículos Tiro con Arco
          </span>
        </Link>

        {/* Menú desktop */}
        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-7">
          <a
            href={portfolioHref}
            className="font-label text-label-lg text-light-on-surface-variant hover:text-light-primary transition-colors"
          >
            Artículos
          </a>
          <Link
            href="/cuaderno-tiro"
            className={`font-label text-label-lg transition-colors flex items-center gap-1 ${
              isCuaderno
                ? 'text-light-primary font-bold'
                : 'text-light-on-surface-variant hover:text-light-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm text-gold-accent">menu_book</span>
            <span>Cuaderno de tiro</span>
          </Link>
          <a
            href={monitorHref}
            className="font-label text-label-lg text-light-on-surface-variant hover:text-light-primary transition-colors"
          >
            El instructor
          </a>
          <a
            href={contactHref}
            className="font-label text-label-lg text-light-on-surface-variant hover:text-light-primary transition-colors"
          >
            Contacto
          </a>
          <ManualModalButton variant="header" />
          <a
            href={contactHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-sm border border-light-primary text-light-primary bg-transparent hover:bg-light-primary hover:text-light-on-primary transition-colors"
          >
            <span className="font-label text-label-lg">Asesoría</span>
          </a>
        </nav>

        {/* Botón menú móvil */}
        <button
          id="mobileMenuBtn"
          type="button"
          aria-label="Abrir menú de navegación"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-sm border border-light-outline-variant bg-light-surface-container-lowest text-light-on-surface hover:bg-light-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-title-lg" aria-hidden="true">
            {mobileOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Menú móvil desplegable */}
      {mobileOpen && (
        <div
          id="mobileMenu"
          className="md:hidden bg-light-surface border-b border-light-outline-variant px-6 py-6 shadow-xl"
        >
          <nav aria-label="Navegación móvil" className="flex flex-col gap-4">
            <a
              href={portfolioHref}
              onClick={() => setMobileOpen(false)}
              className="font-body text-title-md text-light-on-surface py-1"
            >
              Artículos
            </a>
            <Link
              href="/cuaderno-tiro"
              onClick={() => setMobileOpen(false)}
              className="font-body text-title-md text-light-primary font-semibold py-1 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-gold-accent">menu_book</span>
              <span>Cuaderno de tiro</span>
            </Link>
            <a
              href={monitorHref}
              onClick={() => setMobileOpen(false)}
              className="font-body text-title-md text-light-on-surface py-1"
            >
              El instructor
            </a>
            <a
              href={contactHref}
              onClick={() => setMobileOpen(false)}
              className="font-body text-title-md text-light-on-surface py-1"
            >
              Contacto
            </a>
            <div className="py-1">
              <ManualModalButton variant="header" />
            </div>
            <a
              href={contactHref}
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-sm bg-light-primary text-light-on-primary font-label text-label-lg mt-2"
            >
              Solicitar asesoría
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

export function PublicFooter({
  whatsapp,
  categories = [],
}: {
  whatsapp: WhatsAppConfig;
  categories?: CategoryGroup[];
}) {
  const year = new Date().getFullYear();

  return (
    <>
      <footer className="bg-light-primary text-light-on-primary pt-16 pb-12 border-t border-light-primary-container print:hidden">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex flex-col gap-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            <div className="md:col-span-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 28 28"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0 text-white"
                >
                  <path
                    d="M6 22C11.5 16.5 11.5 11.5 6 6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <line x1="6" y1="6" x2="6" y2="22" stroke="#D98218" strokeWidth="1.4" />
                  <line
                    x1="4"
                    y1="14"
                    x2="23"
                    y2="14"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M19.5 10.5L23.5 14L19.5 17.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-headline text-headline-sm text-white tracking-tight">
                  Artículos Tiro con Arco
                </span>
              </div>
              <p className="font-body text-body-sm text-white/70 max-w-sm">
                Archivo técnico editorial dedicado a la biomecánica, puesta a punto milimétrica y
                preparación psicológica para arqueros de todas las disciplinas.
              </p>
            </div>

            <div className="md:col-span-3 flex flex-col gap-3">
              <span className="font-headline text-title-md text-white uppercase tracking-wider">
                Capítulos del Archivo
              </span>
              <ul className="flex flex-col gap-2 font-body text-body-sm text-white/70">
                {categories.map((cat) => (
                  <li key={cat.key}>
                    <Link
                      href={`/categoria/${encodeURIComponent(cat.key)}`}
                      className="hover:text-white transition-colors"
                    >
                      {cat.roman} · {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2 flex flex-col gap-3">
              <span className="font-headline text-title-md text-white uppercase tracking-wider">
                Explorar
              </span>
              <ul className="flex flex-col gap-2 font-body text-body-sm text-white/70">
                <li>
                  <Link href="/#portfolio" className="hover:text-white transition-colors">
                    Índice general
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cuaderno-tiro"
                    className="text-gold-accent hover:text-white transition-colors font-semibold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">menu_book</span> Cuaderno de tiro
                  </Link>
                </li>
                <li>
                  <Link href="/#monitor" className="hover:text-white transition-colors">
                    El instructor
                  </Link>
                </li>
                <li>
                  <Link href="/#contact" className="hover:text-white transition-colors">
                    Contacto técnico
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 flex flex-col gap-3">
              <span className="font-headline text-title-md text-white uppercase tracking-wider">
                Atención y Galería
              </span>
              <p className="font-body text-body-sm text-white/70">
                Consultas técnicas individuales en pista o análisis de biomecánica por vídeo.
              </p>
              <div className="flex items-center gap-2 text-white/90 font-mono text-mono-sm mt-1">
                <span className="material-symbols-outlined text-gold-accent">mail</span>
                <span>asesoria@tiroconarco.es</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/60 font-body text-body-sm">
            <span>
              &copy; {year} Artículos Tiro con Arco. Todos los derechos reservados. Diseñado por DCM
            </span>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-white/50">
              <ManualModalButton variant="footer" />
              <span>•</span>
              <Link
                href="/admin"
                className="hover:text-gold-accent transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">lock</span>
                <span>Acceso Monitor</span>
              </Link>
              <span>•</span>
              <span>Next.js · Supabase</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Botón Flotante Oficial de WhatsApp */}
      <aside
        aria-label="Contacto directo por WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center group select-none print:hidden"
      >
        <a
          href={whatsapp.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 mr-3 px-4 py-2.5 rounded-2xl bg-light-primary text-white text-xs font-semibold shadow-2xl border border-emerald-400/30 backdrop-blur-md opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {whatsapp.tooltip} <strong className="text-emerald-300">¡Escríbeme!</strong>
          </span>
        </a>

        <a
          href={whatsapp.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir conversación de WhatsApp con Damià Juan Ramis"
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white shadow-xl shadow-emerald-950/40 border-2 border-emerald-400/40 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
        >
          <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping -z-10 opacity-75" />
          <svg
            className="w-7 h-7 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
        </a>
      </aside>
    </>
  );
}
