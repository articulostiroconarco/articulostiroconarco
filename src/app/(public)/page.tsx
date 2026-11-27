import Image from 'next/image';
import Link from 'next/link';
import { ContactFormClient } from '@/components/public/ContactFormClient';
import { HomeCatalogClient } from '@/components/public/HomeCatalogClient';
import { generateCsrfToken } from '@/lib/security/csrf';
import { getCachedCatalog, getFeaturedArticle } from '@/repositories/article-repository';

export default async function HomePage() {
  const [{ categories }, featured] = await Promise.all([
    getCachedCatalog(),
    getFeaturedArticle(),
  ]);

  const categoryList = Object.values(categories);
  const csrfToken = generateCsrfToken();
  const currentYear = new Date().getFullYear();

  return (
    <main id="top" className="flex-1">
      {/* Hero Banner cinemático de Stitch */}
      <section className="pt-20">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 pt-6 pb-16 md:pb-24">
          <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/9] rounded-sm overflow-hidden border border-light-outline-variant bg-light-primary shadow-lg">
            <Image
              src="/assets/img/hero.jpg"
              alt="Arquero en apertura completa con arco recurvo al amanecer en galería de bosque"
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-light-on-surface/90 via-light-on-surface/65 to-light-on-surface/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-light-on-surface/75 via-transparent to-transparent" />

            <div className="relative z-10 h-full flex flex-col justify-end p-8 sm:p-12 lg:p-16 max-w-3xl gap-6">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-gold-accent" />
                <span className="font-mono text-mono-sm uppercase tracking-widest text-gold-tint">
                  Archivo técnico · Ed. {currentYear}
                </span>
              </div>

              <h1 className="font-headline text-display-lg-mobile md:text-display-lg text-white text-balance leading-none">
                El dominio técnico y mental del tiro con arco
              </h1>

              <p className="font-body text-body-lg text-light-inverse-on-surface max-w-prose text-pretty">
                Un compendio editorial estructurado sobre biomecánica, puesta a punto de material,
                psicología competitiva y tiro tradicional, escrito desde la práctica diaria en la línea de
                tiro.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#portfolio"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-sm bg-light-surface text-light-primary hover:bg-gold-tint transition-colors"
                >
                  <span className="font-label text-label-lg font-semibold">Explorar el índice</span>
                  <span className="material-symbols-outlined text-title-md">arrow_downward</span>
                </a>
                {featured ? (
                  <Link
                    href={`/articulo/${encodeURIComponent(featured.slug)}`}
                    className="inline-flex items-center gap-2 px-4 py-3 font-label text-label-lg text-white hover:text-gold-tint transition-colors"
                  >
                    <span className="material-symbols-outlined text-title-md text-gold-accent">star</span>
                    <span>Monografía destacada</span>
                    <span className="material-symbols-outlined text-title-md">arrow_forward</span>
                  </Link>
                ) : (
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 px-4 py-3 font-label text-label-lg text-white hover:text-gold-tint transition-colors"
                  >
                    <span>Consultar con el instructor</span>
                    <span className="material-symbols-outlined text-title-md">arrow_forward</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Índice de Categorías y Artículos */}
      <HomeCatalogClient categories={categoryList} />

      {/* Sección Sobre el Monitor */}
      <section id="monitor" className="py-16 md:py-24 border-t border-light-outline-variant bg-light-surface-container-low">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-5">
              <figure className="flex flex-col gap-3">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm border border-light-outline-variant bg-light-surface-container">
                  <Image
                    src="/assets/img/instructor.jpg"
                    alt="Damiá Juan Ramis, entrenador e instructor experto en tiro con arco"
                    fill
                    sizes="(max-width: 1024px) 100vw, 480px"
                    className="object-cover object-top"
                  />
                </div>
                <figcaption className="font-body text-body-sm text-light-on-surface-variant flex items-center justify-between border-t border-light-outline-variant pt-2">
                  <span className="font-semibold text-light-on-surface">
                    Damiá Juan Ramis · Entrenador Nacional RFETA
                  </span>
                  <span className="font-mono text-mono-sm text-light-secondary font-bold tabular-nums">
                    18 años de docencia
                  </span>
                </figcaption>
              </figure>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-mono-sm uppercase tracking-widest text-light-secondary font-bold">
                  Sobre el monitor
                </span>
                <h2 className="font-headline text-headline-lg-mobile md:text-headline-lg text-light-on-surface text-balance">
                  Enseñar a leer cada disparo antes de buscar la puntuación
                </h2>
              </div>

              <div className="flex flex-col gap-4 max-w-prose">
                <p className="font-body text-body-lg text-light-on-surface text-pretty">
                  Soy Damiá Juan Ramis, monitor titulado por la Real Federación Española de Tiro con Arco y
                  especialista en biomecánica aplicada al arco recurvo olímpico y tradicional.
                </p>
                <p className="font-body text-body-md text-light-on-surface-variant text-pretty">
                  Tras casi dos décadas formando a arqueros desde su primera toma de contacto hasta
                  campeonatos nacionales, este archivo nace con un propósito sencillo: ofrecer explicaciones
                  claras, sin mitos de galería ni recetas universales, para que comprendas qué ocurre en tu
                  cuerpo y en tu material en cada ciclo de tiro.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-light-outline-variant">
                <div className="flex flex-col gap-1">
                  <span className="font-headline text-headline-md text-light-primary tabular-nums">
                    18+ años
                  </span>
                  <span className="font-body text-body-sm text-light-on-surface-variant">
                    Dirección técnica en club y tecnificación
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-headline text-headline-md text-light-primary tabular-nums">
                    Nivel III
                  </span>
                  <span className="font-body text-body-sm text-light-on-surface-variant">
                    Titulación nacional de entrenador RFETA
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-headline text-headline-md text-light-primary tabular-nums">
                    320+
                  </span>
                  <span className="font-body text-body-sm text-light-on-surface-variant">
                    Arqueros asesorados en pista y vídeo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Contacto y Asesoría Técnica */}
      <section id="contact" className="py-16 md:py-24 border-t border-light-outline-variant bg-light-surface">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-mono-sm uppercase tracking-widest text-light-secondary font-bold">
                  Contacto y asesoría
                </span>
                <h2 className="font-headline text-headline-lg-mobile md:text-headline-lg text-light-on-surface text-balance">
                  Resuelve tus dudas técnicas o solicita una sesión
                </h2>
              </div>
              <p className="font-body text-body-md text-light-on-surface-variant text-pretty">
                Escríbeme para consultar sobre la puesta a punto de tu equipo, proponer temas que te
                gustaría ver documentados en el archivo o coordinar una sesión técnica personalizada.
              </p>

              <div className="p-6 bg-light-surface-container-low rounded-sm border border-light-outline-variant flex flex-col gap-4">
                <span className="font-mono text-mono-sm uppercase tracking-wider text-light-primary font-bold">
                  Modalidades de asesoría
                </span>
                <ul className="flex flex-col gap-3 font-body text-body-sm text-light-on-surface-variant">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-gold-accent shrink-0">videocam</span>
                    <span>
                      <strong>Análisis técnico en vídeo:</strong> Envío de tanda grabada y devolución con
                      correcciones biomecánicas en 48 h.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-gold-accent shrink-0">person</span>
                    <span>
                      <strong>Sesión en galería:</strong> Trabajo directo sobre alineación, anclaje y rutina
                      en línea de tiro.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-gold-accent shrink-0">tune</span>
                    <span>
                      <strong>Puesta a punto de equipo:</strong> Fístula, tiller, botón Berger y bare shaft
                      tuning.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-7">
              <ContactFormClient csrfToken={csrfToken} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
