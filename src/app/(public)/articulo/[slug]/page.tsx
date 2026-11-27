import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ReadingProgressBar } from '@/components/public/ReadingProgressBar';
import { findArticleBySlug, getRelatedArticles } from '@/repositories/article-repository';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await findArticleBySlug(slug);
  if (!article) {
    return { title: 'Artículo no encontrado' };
  }
  return {
    title: article.title,
    description: article.excerpt || article.subtitle || `Monografía técnica de ${article.categoryName}`,
    openGraph: {
      title: `${article.title} · Artículos de Tiro con Arco`,
      description: article.excerpt || article.subtitle,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author],
    },
  };
}

export default async function ArticleShowPage({ params }: Props) {
  const { slug } = await params;
  const article = await findArticleBySlug(slug);

  if (!article) {
    redirect('/');
  }

  const related = await getRelatedArticles(article, 3);
  const pdfFilename = `${article.number}-${article.slug}.pdf`;
  const levelBadgeClass =
    article.level === 'Iniciación'
      ? 'bg-light-surface-container text-light-on-surface-variant'
      : article.level === 'Intermedio'
      ? 'bg-gold-tint text-light-tertiary'
      : 'bg-light-secondary-container text-light-on-secondary-container';

  const driveViewUrl = article.driveUrl || 'https://drive.google.com';
  const drivePreviewUrl = article.drivePreviewUrl;
  const driveDownloadUrl = article.driveDownloadUrl || driveViewUrl;

  return (
    <>
      <ReadingProgressBar />

      <main className="flex-1 pt-20">
        <article className="max-w-[1200px] mx-auto px-6 md:px-12 py-10 md:py-16">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-light-outline-variant">
            <Link
              href="/#portfolio"
              className="inline-flex items-center gap-2 font-label text-label-lg text-light-on-surface-variant hover:text-light-primary transition-colors duration-150"
            >
              <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                arrow_back
              </span>
              <span>Volver al índice general</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className={`font-label text-label-md px-2.5 py-0.5 rounded-xs ${levelBadgeClass}`}>
                {article.level}
              </span>
            </div>
          </div>

          {/* Cabecera editorial */}
          <header className="py-10 md:py-14 max-w-4xl flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-mono-sm uppercase tracking-widest text-light-secondary font-bold">
                {article.categoryRoman} · {article.categoryName} · Artículo {article.number}
              </span>
            </div>

            <h1 className="font-headline text-display-lg-mobile md:text-display-lg text-light-on-surface text-balance">
              {article.title}
            </h1>

            <p className="font-body text-body-lg text-light-on-surface-variant max-w-prose text-pretty">
              {article.excerpt}
            </p>
          </header>

          {/* Visor integrado de documento */}
          <div className="flex flex-col gap-12">
            <section id="visor-pdf" aria-labelledby="visor-pdf-heading" className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="visor-pdf-heading" className="font-headline text-headline-md text-light-on-surface">
                  Documento {article.fileType || 'Técnico'}
                </h2>
                <span className="font-mono text-mono-sm text-light-on-surface-variant tabular-nums">
                  {article.fileType || 'Doc'} · Google Drive
                </span>
              </div>

              <div className="rounded-sm border border-light-outline-variant bg-light-surface-container-low overflow-hidden">
                <div className="bg-light-surface-container-lowest border-b border-light-outline-variant px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="material-symbols-outlined text-title-lg text-light-secondary shrink-0"
                      aria-hidden="true"
                    >
                      picture_as_pdf
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-mono-sm text-light-on-surface break-all font-semibold">
                        {pdfFilename}
                      </span>
                      <span className="font-body text-body-sm text-light-on-surface-variant">
                        {drivePreviewUrl
                          ? 'Alojado en Google Drive · Lectura integrada'
                          : `Por ${article.author} · ${article.publishedAt}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {drivePreviewUrl ? (
                      <>
                        <a
                          href={driveViewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-sm border border-light-outline-variant bg-light-surface-container-lowest text-light-on-surface hover:border-light-primary hover:text-light-primary transition-colors duration-150"
                        >
                          <span className="material-symbols-outlined text-title-sm" aria-hidden="true">
                            open_in_new
                          </span>
                          <span className="font-label text-label-md whitespace-nowrap">Abrir en Drive</span>
                        </a>
                        <a
                          href={driveDownloadUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-sm bg-light-primary text-light-on-primary hover:bg-light-primary-container transition-colors duration-150"
                        >
                          <span className="material-symbols-outlined text-title-sm" aria-hidden="true">
                            download
                          </span>
                          <span className="font-label text-label-md whitespace-nowrap">
                            Descargar {article.fileType || 'Documento'}
                          </span>
                        </a>
                      </>
                    ) : (
                      <Link
                        href="/#contact"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-sm bg-light-primary text-light-on-primary hover:bg-light-primary-container transition-colors duration-150"
                      >
                        <span className="material-symbols-outlined text-title-sm" aria-hidden="true">
                          mail
                        </span>
                        <span className="font-label text-label-md whitespace-nowrap">
                          Solicitar documento
                        </span>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="bg-light-surface-container p-3 sm:p-6 flex flex-col items-center gap-4">
                  {drivePreviewUrl ? (
                    <div className="w-full max-w-[1000px] h-[650px] md:h-[820px] rounded-xs overflow-hidden border border-light-outline-variant bg-white shadow-sm flex flex-col">
                      <iframe
                        src={drivePreviewUrl}
                        className="w-full h-full border-0"
                        title={`Visor PDF - ${article.title}`}
                        loading="lazy"
                        allow="autoplay"
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-[820px] bg-light-surface-container-lowest border border-light-outline-variant rounded-xs p-6 sm:p-10 shadow-sm flex flex-col gap-6">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-light-outline-variant">
                        <span className="font-mono text-mono-sm uppercase tracking-widest text-light-secondary font-bold">
                          Ficha Técnica Nº {article.number} · {article.categoryName}
                        </span>
                        <span className="font-mono text-mono-sm text-light-on-surface-variant tabular-nums">
                          Lectura editorial
                        </span>
                      </div>

                      <div className="flex flex-col gap-3">
                        {article.subtitle && (
                          <p className="font-body text-body-lg text-light-on-surface font-semibold">
                            {article.subtitle}
                          </p>
                        )}
                        <p className="font-body text-body-md text-light-on-surface-variant text-pretty leading-relaxed whitespace-pre-line">
                          {article.excerpt}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="w-full max-w-[1000px] flex flex-wrap items-center justify-between gap-4 text-light-on-surface-variant">
                    <span className="font-mono text-mono-sm tabular-nums">
                      {drivePreviewUrl
                        ? 'Vista previa interactiva · Documento oficial'
                        : 'Ficha técnica en línea'}
                    </span>
                    {drivePreviewUrl && (
                      <a
                        href={driveViewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xs border border-light-outline-variant bg-light-surface-container-lowest font-label text-label-md text-light-on-surface hover:border-light-primary hover:text-light-primary transition-colors"
                      >
                        <span>Pantalla completa / Imprimir</span>
                        <span className="material-symbols-outlined text-title-sm" aria-hidden="true">
                          open_in_new
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Resumen y notas técnicas complementarias */}
            {drivePreviewUrl && (article.subtitle || article.excerpt) && (
              <section
                aria-label="Notas y resumen técnico"
                className="max-w-[1000px] mx-auto w-full bg-light-surface-container-lowest border border-light-outline-variant rounded-sm p-6 sm:p-8 flex flex-col gap-4"
              >
                <h3 className="font-headline text-headline-sm text-light-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-light-secondary" aria-hidden="true">
                    menu_book
                  </span>
                  <span>Resumen y Notas Técnicas</span>
                </h3>
                <div className="font-body text-body-md text-light-on-surface-variant text-pretty leading-relaxed space-y-3">
                  {article.subtitle && (
                    <p className="text-body-lg text-light-on-surface font-semibold">{article.subtitle}</p>
                  )}
                  <p className="whitespace-pre-line">{article.excerpt}</p>
                </div>
              </section>
            )}

            {/* Artículos relacionados */}
            {related.length > 0 && (
              <section
                aria-label="Siguientes lecturas de la categoría"
                className="pt-10 border-t border-light-outline-variant flex flex-col gap-5"
              >
                <span className="font-mono text-mono-sm uppercase tracking-widest text-light-on-surface-variant font-bold">
                  Continúa en {article.categoryName}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {related.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/articulo/${encodeURIComponent(rel.slug)}`}
                      className="group p-5 rounded-sm border border-light-outline-variant bg-light-surface-container-low hover:border-light-primary transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-mono-sm text-light-secondary tabular-nums shrink-0 font-bold">
                          {rel.number}
                        </span>
                        <span className="font-body text-body-md text-light-on-surface group-hover:text-light-primary transition-colors">
                          {rel.title}
                        </span>
                      </div>
                      <span
                        className="material-symbols-outlined text-title-md text-light-on-surface-variant group-hover:text-light-primary group-hover:translate-x-1 transition-transform duration-150 shrink-0"
                        aria-hidden="true"
                      >
                        arrow_forward
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </main>
    </>
  );
}
