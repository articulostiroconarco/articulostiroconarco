'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ArticleEntity, CategoryGroup } from '@/types/domain';

interface Props {
  categories: CategoryGroup[];
}

export function HomeCatalogClient({ categories }: Props) {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [previewArticle, setPreviewArticle] = useState<ArticleEntity | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onCancel = (e: Event) => e.preventDefault();
    dlg.addEventListener('cancel', onCancel);
    return () => dlg.removeEventListener('cancel', onCancel);
  }, []);

  const openQuickView = (art: ArticleEntity, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreviewArticle(art);
    dialogRef.current?.showModal();
  };

  const closeQuickView = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
  };

  const consultFromModal = () => {
    const title = previewArticle?.title || '';
    closeQuickView();
    const messageEl = document.getElementById('contactMessage') as HTMLTextAreaElement | null;
    if (messageEl && title) {
      messageEl.value = `Consulta técnica sobre el artículo "${title}": `;
      messageEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const contactSec = document.getElementById('contact');
    if (contactSec) {
      contactSec.scrollIntoView({ behavior: 'smooth' });
      messageEl?.focus();
    }
  };

  const totalArticlesCount = categories.reduce((acc, c) => acc + c.articles.length, 0);
  const normalizedQuery = query.trim().toLowerCase();
  const isSearchingOrFiltering = normalizedQuery !== '' || levelFilter !== 'all';

  const levels = [
    { key: 'all', label: 'Todos' },
    { key: 'Iniciación', label: 'Iniciación' },
    { key: 'Intermedio', label: 'Intermedio' },
    { key: 'Avanzado', label: 'Avanzado' },
  ];

  return (
    <>
      <section id="portfolio" className="py-16 md:py-24 border-t border-light-outline-variant bg-light-surface">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          {/* Cabecera del índice */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-light-on-surface">
            <div className="lg:col-span-7 flex flex-col gap-3">
              <span className="font-mono text-mono-sm uppercase tracking-widest text-light-secondary font-bold">
                Índice general de contenidos
              </span>
              <h2 className="font-headline text-display-md-mobile md:text-display-md text-light-on-surface text-balance">
                Directorio temático por categorías
              </h2>
            </div>
            <div className="lg:col-span-5 flex flex-col justify-end gap-4">
              <p className="font-body text-body-md text-light-on-surface-variant text-pretty">
                Selección de monografías destacadas organizadas en {categories.length} bloques temáticos
                directamente desde la base de datos técnica. Selecciona cualquier título para abrir su
                ficha o entra en la categoría para ver todos los artículos ({totalArticlesCount} disponibles).
              </p>

              {/* Filtros de nivel */}
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar artículos por nivel">
                {levels.map((lvl) => {
                  const selected = levelFilter === lvl.key;
                  return (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => setLevelFilter(lvl.key)}
                      className={`px-3 py-1 rounded-xs font-label text-label-md transition-colors cursor-pointer ${
                        selected
                          ? 'bg-light-primary text-light-on-primary'
                          : 'border border-light-outline-variant text-light-on-surface-variant hover:border-light-primary hover:text-light-primary'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Buscador en vivo rápido */}
          <div className="py-6 border-b border-light-outline-variant flex items-center gap-3">
            <span className="material-symbols-outlined text-light-on-surface-variant">search</span>
            <input
              type="text"
              id="searchInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar rápidamente por técnica, término o concepto (ej. escápula, clicker, spine)..."
              className="w-full bg-transparent border-0 text-light-on-surface placeholder:text-light-on-surface-variant/70 font-body text-body-md focus:ring-0 focus:outline-none"
            />
            {query !== '' && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="font-mono text-xs text-light-secondary uppercase tracking-wider shrink-0 hover:underline cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Contenedor de categorías y artículos */}
          <div id="directoryContainer" className="divide-y divide-light-outline-variant">
            {categories.map((catData) => {
              const sourceArticles = isSearchingOrFiltering
                ? catData.articles
                : catData.articles.filter((a) => a.isFeatured);

              const visibleArticles = sourceArticles.filter((art) => {
                const matchLevel =
                  levelFilter === 'all' || art.level.toLowerCase() === levelFilter.toLowerCase();
                const matchQuery =
                  normalizedQuery === '' ||
                  art.title.toLowerCase().includes(normalizedQuery) ||
                  art.excerpt.toLowerCase().includes(normalizedQuery) ||
                  art.subtitle.toLowerCase().includes(normalizedQuery);
                return matchLevel && matchQuery;
              });

              if (isSearchingOrFiltering && visibleArticles.length === 0) {
                return null;
              }

              return (
                <section
                  key={catData.key}
                  id={`cat-${catData.key}`}
                  className="category-block py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
                >
                  <div className="lg:col-span-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-mono-sm text-light-secondary font-bold tabular-nums">
                        {catData.roman}
                      </span>
                      <span className="h-px w-5 bg-gold-accent" />
                    </div>
                    <h3 className="font-headline text-headline-md text-light-on-surface">
                      {catData.name}
                    </h3>
                    <p className="font-body text-body-sm text-light-on-surface-variant text-pretty max-w-sm">
                      {catData.description}
                    </p>
                  </div>

                  <div className="lg:col-span-8 flex flex-col divide-y divide-light-outline-variant border-t border-light-outline-variant lg:border-t-0">
                    {visibleArticles.length === 0 ? (
                      <p className="py-6 font-body text-body-sm text-light-on-surface-variant italic">
                        No hay artículos destacados en esta categoría actualmente.
                      </p>
                    ) : (
                      visibleArticles.map((art) => {
                        const badgeClass =
                          art.level === 'Avanzado'
                            ? 'bg-light-secondary-container text-light-on-secondary-container'
                            : art.level === 'Intermedio'
                            ? 'bg-gold-tint text-light-tertiary'
                            : 'bg-light-surface-container text-light-on-surface-variant';

                        return (
                          <div
                            key={art.slug}
                            className="article-item group w-full text-left py-5 first:pt-0 lg:first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-light-surface-container-low/60 px-2 -mx-2 rounded-sm transition-colors"
                          >
                            <Link
                              href={`/articulo/${encodeURIComponent(art.slug)}`}
                              className="flex items-baseline gap-4 pr-2 flex-1"
                            >
                              <span className="font-mono text-mono-sm text-light-secondary tabular-nums shrink-0 font-bold">
                                {art.number}
                              </span>
                              <div className="flex flex-col gap-1">
                                <span className="font-body text-title-md text-light-on-surface group-hover:text-light-primary transition-colors font-semibold">
                                  {art.title}
                                </span>
                                <span className="font-body text-body-sm text-light-on-surface-variant text-pretty">
                                  {art.excerpt}
                                </span>
                              </div>
                            </Link>
                            <div className="flex items-center gap-3 shrink-0 pl-8 sm:pl-0">
                              <span className={`font-label text-label-md px-2.5 py-0.5 rounded-xs ${badgeClass}`}>
                                {art.fileType || art.level}
                              </span>
                              {art.isFeatured && (
                                <span
                                  className="inline-flex items-center gap-0.5 font-mono text-xs text-gold-accent font-bold"
                                  title="Artículo destacado"
                                >
                                  <span className="material-symbols-outlined text-body-md text-gold-accent">
                                    star
                                  </span>
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => openQuickView(art, e)}
                                className="p-1 text-light-on-surface-variant hover:text-light-primary transition-colors cursor-pointer"
                                title="Vista rápida en modal"
                                aria-label={`Vista rápida de ${art.title}`}
                              >
                                <span className="material-symbols-outlined text-base">visibility</span>
                              </button>
                              <Link
                                href={`/articulo/${encodeURIComponent(art.slug)}`}
                                className="inline-flex items-center gap-1 font-label text-label-md text-light-on-surface-variant group-hover:text-light-primary transition-colors"
                              >
                                <span>Leer artículo</span>
                                <span className="material-symbols-outlined text-title-md text-light-on-surface-variant group-hover:text-light-primary group-hover:translate-x-1 transition-transform">
                                  arrow_forward
                                </span>
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}

                    <div className="pt-5 flex items-center justify-between gap-4">
                      <Link
                        href={`/categoria/${encodeURIComponent(catData.key)}`}
                        className="group inline-flex items-center gap-2 font-label text-label-lg text-light-primary hover:text-light-secondary transition-colors"
                      >
                        <span>
                          Ver todos los artículos ({catData.articles.length}) de {catData.name}
                        </span>
                        <span
                          className="material-symbols-outlined text-title-md group-hover:translate-x-1 transition-transform"
                          aria-hidden="true"
                        >
                          arrow_forward
                        </span>
                      </Link>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal Estricto de Lectura Rápida de Artículo */}
      <dialog
        ref={dialogRef}
        id="articleModal"
        className="w-[calc(100%-2rem)] max-w-3xl rounded-sm bg-light-surface-container-lowest border border-light-outline-variant p-0 text-light-on-surface m-auto shadow-2xl backdrop:bg-black/50"
      >
        <header className="flex items-start justify-between gap-4 px-6 sm:px-10 py-6 border-b border-light-outline-variant bg-light-surface">
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-mono-sm uppercase tracking-wider text-light-secondary font-bold">
              {previewArticle
                ? [previewArticle.categoryRoman, previewArticle.categoryName, previewArticle.level]
                    .filter(Boolean)
                    .join(' · ')
                : ''}
            </p>
            <h2 className="font-headline text-headline-lg-mobile sm:text-headline-lg text-light-on-surface text-balance">
              {previewArticle?.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeQuickView}
            aria-label="Cerrar lectura de artículo"
            className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-sm border border-light-outline-variant bg-light-surface-container-lowest hover:bg-light-surface-container-low text-light-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-title-md" aria-hidden="true">
              close
            </span>
          </button>
        </header>

        <article className="px-6 sm:px-10 py-8 flex flex-col gap-6 max-h-[65vh] overflow-y-auto">
          {previewArticle?.subtitle && (
            <p className="font-body text-title-md text-light-primary font-semibold">
              {previewArticle.subtitle}
            </p>
          )}
          <p className="font-body text-body-lg text-light-on-surface max-w-prose text-pretty">
            {previewArticle?.excerpt}
          </p>
          <div className="bg-gold-tint border-l-4 border-gold-accent px-5 py-4 rounded-xs">
            <span className="font-mono text-mono-sm uppercase tracking-wider text-light-tertiary block mb-1 font-bold">
              Principio clave de campo
            </span>
            <p className="font-body text-body-md text-light-on-surface">
              Concentra tu atención en la ejecución cinemática y ósea antes de buscar la puntuación sobre
              el amarillo.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <h3 className="font-headline text-headline-sm text-light-on-surface">
              Puntos esenciales de la monografía
            </h3>
            <p className="font-body text-body-md text-light-on-surface-variant">
              Esta ficha técnica resume los aspectos críticos a revisar durante el ciclo de tiro. Para ver
              el documento técnico integrado o descargarlo, pulsa en «Página completa».
            </p>
          </div>
        </article>

        <footer className="px-6 sm:px-10 py-5 border-t border-light-outline-variant bg-light-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={closeQuickView}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-sm border border-light-outline-variant text-light-on-surface hover:bg-light-surface-container font-label text-label-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-title-md" aria-hidden="true">
              arrow_back
            </span>
            <span>Volver a la lista</span>
          </button>
          <div className="flex items-center gap-3">
            {previewArticle && (
              <Link
                href={`/articulo/${encodeURIComponent(previewArticle.slug)}`}
                onClick={closeQuickView}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-sm border border-light-outline text-light-on-surface hover:bg-light-surface-container-low font-label text-label-md transition-colors"
              >
                <span>Página completa</span>
                <span className="material-symbols-outlined text-title-md">open_in_new</span>
              </Link>
            )}
            <button
              type="button"
              onClick={consultFromModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm bg-light-primary text-light-on-primary hover:bg-light-primary-container font-label text-label-lg transition-colors cursor-pointer"
            >
              <span>Consultar al monitor</span>
              <span className="material-symbols-outlined text-title-md">arrow_forward</span>
            </button>
          </div>
        </footer>
      </dialog>
    </>
  );
}
