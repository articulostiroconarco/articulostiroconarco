import type { Metadata } from 'next';
import { Instrument_Sans, Red_Hat_Mono, Sofia_Sans_Condensed } from 'next/font/google';
import { ToastContainer } from '@/components/ui/ToastProvider';
import './globals.css';

const sofia = Sofia_Sans_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-sofia',
  display: 'swap',
});

const instrument = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument',
  display: 'swap',
});

const redHatMono = Red_Hat_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://damia-tiroconarco.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Artículos de Tiro con Arco — Archivo Editorial y Técnica',
    template: '%s · Artículos de Tiro con Arco',
  },
  description:
    'Compendio editorial técnico sobre biomecánica, puesta a punto de material, psicología competitiva, tiro tradicional y cuaderno interactivo de campo por Damiá Juan Ramis.',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Artículos de Tiro con Arco',
    title: 'Artículos de Tiro con Arco — Archivo Editorial y Técnica',
    description:
      'Archivo técnico editorial y suite interactiva de campo para arqueros de todas las disciplinas.',
    images: [{ url: '/assets/img/hero.jpg', width: 1200, height: 675, alt: 'Artículos de Tiro con Arco' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`scroll-smooth ${sofia.variable} ${instrument.variable} ${redHatMono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="bg-light-surface text-light-on-surface font-body antialiased selection:bg-light-primary selection:text-light-on-primary min-h-screen flex flex-col">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
