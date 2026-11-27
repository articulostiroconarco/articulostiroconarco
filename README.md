# Artículos de Tiro con Arco (`DamiaVercel`) — Edición Cloud para Vercel + Supabase

Portal web técnico, archivo editorial especializado y suite interactiva de campo para arqueros de todas las disciplinas (Recurvo Olímpico, Compuesto, *Barebow* y Tradicional), rediseñado arquitectónicamente en **Next.js 15 (App Router) + TypeScript + Tailwind CSS compilado** y conectado al 100 % con **Supabase (PostgreSQL + Auth + RLS)** para despliegue nativo *Serverless* en **Vercel**.

---

## Características Principales y Optimizaciones para Vercel

1. **Arquitectura 100 % Serverless y Sin Estado en Disco:**
   * Eliminación completa de dependencias de disco local (`storage/*.json`, `$_SESSION` y MariaDB local) incompatibles con el sistema de archivos efímero de Vercel.
   * Persistencia centralizada en **Supabase PostgreSQL** (`articulos`, `categorias`, `leads_contacto`, `configuracion_web`).
   * Caché en el borde (*Data Cache / ISR*) mediante `unstable_cache` e invalidación instantánea (`revalidateTag` / `revalidatePath`) cada vez que el monitor guarda cambios desde `/admin`.
   * Autenticación privada en `/admin` mediante **Supabase Auth SSR (`@supabase/ssr`)** con cookies seguras `HttpOnly`, `SameSite=Lax` y `Secure` protegidas por Middleware.
   * Protección **Anti-CSRF sin estado** firmada criptográficamente con `HMAC-SHA256` (`timingSafeEqual`) + verificación de cabecera `Origin` y limitador de tasa por IP.

2. **Blindaje de Seguridad RLS en Supabase:**
   * Lectura pública (`SELECT`) habilitada en `categorias`, `articulos` y `configuracion_web`; escritura, edición y borrado restringidos exclusivamente al monitor autenticado (`TO authenticated`).
   * Tabla `leads_contacto` blindada frente a exposición de datos personales: el visitante anónimo solo puede insertar (`INSERT` con retorno mínimo), y únicamente el monitor autenticado puede leer, marcar o eliminar consultas.

3. **Diseño Editorial Stitch y Velocidad Máxima (Core Web Vitals):**
   * **Tailwind CSS compilado en tiempo de build** (eliminando los ~300 KB bloqueantes del script CDN en vivo).
   * Tipografías deportivas (*Sofia Sans Condensed*, *Instrument Sans* y *Red Hat Mono*) optimizadas y servidas sin saltos visuales con `next/font/google`.
   * Imágenes optimizadas automáticamente a formatos `AVIF` y `WebP` con `next/image`.
   * SEO dinámico por monografía y categoría (`generateMetadata`, `OpenGraph`), más `sitemap.xml` y `robots.txt` automáticos.

4. **Funcionalidades Completas del Portal:**
   * **Catálogo Editorial (`/` y `/articulos`):** Hero cinemático, monografía destacada, directorio por categorías con numeración romana, filtro por niveles, buscador reactivo en vivo, vista rápida en modal estricto, bloque del instructor (`#monitor`), formulario de asesoría (`#contact` con soporte opcional de avisos por correo vía **Resend API**), Manual de Usuario integrado en pantalla y botón flotante de WhatsApp.
   * **Lectura Técnica (`/articulo/[slug]`):** Barra de progreso de lectura superior, visor integrado de Google Drive (`/preview`) con descarga directa (o ficha editorial en línea si no adjunta documento) y lecturas relacionadas.
   * **Categorías (`/categoria/[slug]`):** Buscador interno, filtrado por nivel y continuidad editorial entre capítulos.
   * **Cuaderno de Tiro (`/cuaderno-tiro`):** Diana interactiva World Archery SVG (*plotter* táctil X, 10..1 y Miss), generación de informes y 3 plantillas A4 en PDF, exportación CSV (UTF-8 con BOM), calculadora de *spine*, conversor físico normalizado, semáforo reglamentario con silbatos `Web Audio API` e historial privado en `localStorage`.
   * **Panel del Monitor (`/admin`):** Dashboard de métricas en vivo, CRUD completo de categorías y artículos con tablas ordenables/paginadas y modales estrictos, buzón de consultas con respuesta en 1 clic por WhatsApp o email, y configuración en tiempo real de WhatsApp y correo receptor.

---

## Estructura del Proyecto

```text
DamiaVercel/
├── docs/                          # Documentación técnica sincronizada (prd.md, erd.md, manual_usuario.md)
├── public/assets/img/             # Imágenes base optimizadas por next/image (hero.jpg, instructor.jpg)
├── supabase/migrations/           # Migración SQL de índices y políticas RLS seguras
├── src/
│   ├── app/
│   │   ├── (public)/              # Rutas públicas (/, /articulos, /articulo/[slug], /categoria/[slug], /cuaderno-tiro)
│   │   ├── admin/                 # Panel privado (/admin/login, /admin, /categorias, /articulos, /mensajes, /configuracion)
│   │   ├── api/                   # Endpoints Serverless (/api/contacto, /api/articulos, /api/manual, /api/health, /api/admin/*)
│   │   ├── layout.tsx             # Layout raíz con fuentes compiladas y metadatos SEO
│   │   ├── sitemap.ts             # Mapa XML dinámico conectado a Supabase
│   │   └── robots.ts              # Reglas de indexación para buscadores
│   ├── components/
│   │   ├── public/                # Cabecera, pie, buscador, modal de manual, visor y formulario de contacto
│   │   ├── workbook/              # Suite interactiva completa del Cuaderno de Tiro
│   │   ├── admin/                 # Modales estrictos, paginación y gestores CRUD del monitor
│   │   └── ui/                    # Sistema global de notificaciones Toast
│   ├── lib/
│   │   ├── supabase/              # Clientes público (ISR) y SSR (cookies HttpOnly) + Middleware
│   │   └── security/              # Anti-CSRF firmado con HMAC-SHA256 y Rate Limiter
│   ├── repositories/              # Acceso tipado a Supabase y revalidación de caché
│   ├── services/                  # Reglas de negocio (Config, Contact, Resend Mailer, Health)
│   └── types/                     # Entidades y contratos TypeScript estrictos
├── next.config.mjs                # Cabeceras HTTP de seguridad, CSP e imágenes AVIF/WebP
├── tailwind.config.ts             # Tokens cromáticos y tipográficos oficiales de Stitch
└── .env.example                   # Plantilla limpia de variables de entorno (sin secretos)
```

---

## Ejecución en Local

1. Instalar dependencias:
   ```powershell
   cd "F:\xampp8\htdocs\DamiaVercel"
   npm install
   ```
2. Verificar tipado y compilación de producción (idéntica a Vercel):
   ```powershell
   npm run typecheck
   npm run build
   ```
3. Iniciar servidor de desarrollo en `http://localhost:3000`:
   ```powershell
   npm run dev
   ```

---

## Guía Paso a Paso para Desplegar en Vercel

1. Sube la carpeta `DamiaVercel` a un repositorio nuevo en tu cuenta de **GitHub** (el archivo `.gitignore` ya protege `.env.local` para que jamás se suban claves).
2. Entra en [vercel.com](https://vercel.com), pulsa **Add New… → Project** e importa el repositorio.
3. En la sección **Environment Variables** del proyecto en Vercel, añade las siguientes variables (copiando sus valores de tu `.env.local`):
   * `NEXT_PUBLIC_SITE_URL` → Tu dominio final (ej. `https://damia-tiroconarco.vercel.app`)
   * `APP_NAME` → `Artículos de Tiro con Arco`
   * `NEXT_PUBLIC_SUPABASE_URL` → URL de tu proyecto Supabase
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Clave pública (`anon` / `publishable`) de tu proyecto Supabase
   * `CSRF_SECRET` → Una cadena aleatoria larga (32+ caracteres)
   * `ADMIN_NOTIFICATION_EMAIL` → `damiajr@hotmail.com`
   * `RESEND_API_KEY` *(opcional)* → Tu API Key de [resend.com](https://resend.com) si deseas recibir alertas por email además del buzón `/admin/mensajes`.
   * `MAIL_FROM_ADDRESS` *(opcional)* → Correo remitente verificado en Resend (o `onboarding@resend.dev` en pruebas).
4. Pulsa **Deploy**. Vercel detectará **Next.js** automáticamente y publicará el portal en menos de un minuto con certificado HTTPS y CDN global.
