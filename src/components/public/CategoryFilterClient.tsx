'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { CategoryGroup } from '@/types/domain';

interface Props {
  category: CategoryGroup;
  nextCategory: { key: string; name: string; roman: string } | null;
}

export function CategoryFilterClient({ category, nextCategory }: Props) {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');

  const totalArticles = category.articles.length;
  const iniciacionCount = category.articles.filter((a) => a.level === 'Iniciación').length;
  const intermedioCount = category.articles.filter((a) => a.level === 'Intermedio').length;
  const avanzadoCount = category.articles.filter((a) => a.level === 'Avanzado').length;

  const q = query.trim().toLowerCase();
  const filtered = category.articles.filter((art) => {
    const matchLevel = level === 'all' || art.level.toLowerCase() === level.toLowerCase();
    const haystack = `${art.title} ${art.excerpt} ${art.tags.join(' ')}`.toLowerCase();
    const matchQuery = q === '' || haystack.includes(q);
    return matchLevel && matchQuery;
  });

  return (
    <main className="flex-1 pt-20">
      <section className="max-w-[1200px] mx-auto px-6 md:px-12 pt-10 pb-12 border-b border-light-on-surface">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/#portfolio"
              className="inline-flex items-center gap-2 font-label text-label-lg text-light-on-surface-variant hover:text-light-primary transition-colors duration-150"
            >
              <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                arrow_back
              </span>
              <span>Volver al directorio por categorías</span>
            </Link>
            <span className="font-mono text-mono-sm text-light-secondary font-bold tabular-nums">
              {totalArticles} ARTÍCULOS EN ESTA CATEGORÍA
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-mono-sm uppercase tracking-widest text-light-secondary font-bold">
                  Categoría {category.roman}
                </span>
                <span className="h-px w-6 bg-gold-accent" />
              </div>
              <h1 className="font-headline text-display-lg-mobile md:text-display-lg text-light-on-surface text-balance">
                {category.name}
              </h1>
              <p className="font-body text-body-lg text-light-on-surface-variant max-w-prose text-pretty">
                {category.description}
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="font-label text-label-md text-light-on-surface-variant">
                  Buscar dentro de {category.name}
                </span>
                <div className="relative flex items-center">
                  <span
                    className="material-symbols-outlined absolute left-3 text-title-md text-light-outline pointer-events-none"
                    aria-hidden="true"
                  >
                    search
                  </span>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ej. anclaje, clicker, suelta, alineación..."
                    className="w-full pl-10 pr-3.5 py-2 rounded-sm bg-light-surface-container-lowest border border-light-outline-variant text-body-md text-light-on-surface placeholder:text-light-outline focus:border-light-primary focus:ring-1 focus:ring-light-primary focus:outline-none transition-colors duration-150"
                  />
                </div>
              </label>

              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar artículos por nivel">
                <button
                  type="button"
                  onClick={() => setLevel('all')}
                  className={`px-3 py-1 rounded-xs font-label text-label-md transition-colors cursor-pointer ${
                    level === 'all'
                      ? 'bg-light-primary text-light-on-primary'
                      : 'border border-light-outline-variant text-light-on-surface-variant hover:border-light-primary hover:text-light-primary'
                  }`}
                >
                  Todos ({totalArticles})
                </button>
                {iniciacionCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setLevel('Iniciación')}
                    className={`px-3 py-1 rounded-xs font-label text-label-md transition-colors cursor-pointer ${
                      level === 'Iniciación'
                        ? 'bg-light-primary text-light-on-primary'
                        : 'border border-light-outline-variant text-light-on-surface-variant hover:border-light-primary hover:text-light-primary'
                    }`}
                  >
                    Iniciación ({iniciacionCount})
                  </button>
                )}
                {intermedioCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setLevel('Intermedio')}
                    className={`px-3 py-1 rounded-xs font-label text-label-md transition-colors cursor-pointer ${
                      level === 'Intermedio'
                        ? 'bg-light-primary text-light-on-primary'
                        : 'border border-light-outline-variant text-light-on-surface-variant hover:border-light-primary hover:text-light-primary'
                    }`}
                  >
                    Intermedio ({intermedioCount})
                  </button>
                )}
                {avanzadoCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setLevel('Avanzado')}
                    className={`px-3 py-1 rounded-xs font-label text-label-md transition-colors cursor-pointer ${
                      level === 'Avanzado'
                        ? 'bg-light-primary text-light-on-primary'
                        : 'border border-light-outline-variant text-light-on-surface-variant hover:border-light-primary hover:text-light-primary'
                    }`}
                  >
                    Avanzado ({avanzadoCount})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 md:px-12 py-8 md:py-12">
        <div className="divide-y divide-light-outline-variant border-b border-light-outline-variant">
          {totalArticles === 0 ? (
            <div className="py-12 text-center">
              <p className="font-body text-body-md text-light-on-surface-variant italic">
                Actualmente no hay artículos publicados en este bloque temático.
              </p>
            </div>
          ) : (
            filtered.map((art) => {
              const badgeClass =
                art.level === 'Iniciación'
                  ? 'bg-light-surface-container text-light-on-surface-variant'
                  : art.level === 'Intermedio'
                  ? 'bg-gold-tint text-light-tertiary'
                  : 'bg-light-secondary-container text-light-on-secondary-container';

              return (
                <article
                  key={art.slug}
                  className="group w-full text-left py-5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-light-surface-container-low/60 px-2 -mx-2 rounded-sm transition-colors duration-150"
                >
                  <div className="flex items-baseline gap-4 pr-2">
                    <span className="font-mono text-mono-sm text-light-secondary font-bold tabular-nums shrink-0">
                      {art.number}
                    </span>
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/articulo/${encodeURIComponent(art.slug)}`}
                        className="font-body text-title-md font-semibold text-light-on-surface group-hover:text-light-primary transition-colors duration-150"
                      >
                        {art.title}
                      </Link>
                      <p className="font-body text-body-sm text-light-on-surface-variant text-pretty max-w-prose">
                        {art.excerpt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 pl-8 sm:pl-0">
                    <span className={`font-label text-label-md px-2.5 py-0.5 rounded-xs ${badgeClass}`}>
                      {art.level}
                    </span>
                    <Link
                      href={`/articulo/${encodeURIComponent(art.slug)}`}
                      className="inline-flex items-center gap-1 font-mono text-mono-sm text-light-primary hover:text-light-secondary font-semibold transition-colors"
                    >
                      <span>leer</span>
                      <span
                        className="material-symbols-outlined text-title-md group-hover:translate-x-1 transition-transform duration-150"
                        aria-hidden="true"
                      >
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {totalArticles > 0 && filtered.length === 0 && (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-headline-lg text-light-on-surface-variant" aria-hidden="true">
              search_off
            </span>
            <p className="font-body text-title-md text-light-on-surface font-semibold">
              No hay artículos que coincidan con tu búsqueda
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setLevel('all');
              }}
              className="px-4 py-2 rounded-sm border border-light-outline-variant font-label text-label-lg text-light-on-surface hover:bg-light-surface-container-low transition-colors cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        )}

        <div className="pt-12 pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {nextCategory ? (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-mono-sm uppercase tracking-wider text-light-on-surface-variant">
                Siguiente capítulo del índice
              </span>
              <Link
                href={`/categoria/${encodeURIComponent(nextCategory.key)}`}
                className="inline-flex items-center gap-2 font-headline text-headline-md text-light-on-surface hover:text-light-primary transition-colors"
              >
                <span>
                  {nextCategory.roman} · {nextCategory.name}
                </span>
                <span className="material-symbols-outlined text-title-lg" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-mono-sm uppercase tracking-wider text-light-on-surface-variant">
                Fin del compendio
              </span>
              <Link
                href="/#portfolio"
                className="inline-flex items-center gap-2 font-headline text-headline-md text-light-on-surface hover:text-light-primary transition-colors"
              >
                <span>Volver al índice general</span>
                <span className="material-symbols-outlined text-title-lg" aria-hidden="true">
                  arrow_upward
                </span>
              </Link>
            </div>
          )}

          <Link
            href="/#contact"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-light-primary text-light-on-primary hover:bg-light-primary-container transition-colors duration-150"
          >
            <span className="font-label text-label-lg whitespace-nowrap">
              Consultar sobre {category.name.toLowerCase()}
            </span>
            <span className="material-symbols-outlined text-title-md" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
