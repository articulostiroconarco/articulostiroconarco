# PRD — Documento de Requisitos de Producto
## Artículos de Tiro con Arco (`DamiaVercel` — Edición Cloud Serverless)

* **Versión:** 2.0.0
* **Fecha:** 27 de noviembre de 2026
* **Estado:** Implementado y Verificado para Vercel
* **Autor / Responsable:** Damiá Juan Ramis (Entrenador Nacional RFETA) / Equipo de Desarrollo
* **Ubicación en el repositorio:** `docs/prd.md`

---

## 1. Visión General del Producto

**Artículos de Tiro con Arco (`DamiaVercel`)** es el portal técnico editorial, archivo de monografías y suite interactiva de entrenamiento en campo para arqueros de todas las disciplinas (Recurvo Olímpico, Compuesto, *Barebow* y Tradicional).

Esta versión 2.0 evoluciona la plataforma hacia una arquitectura **100 % Cloud-Native Serverless** construida con **Next.js 15 (App Router), TypeScript y Tailwind CSS compilado**, empleando **Supabase (PostgreSQL + Auth + RLS)** como única fuente de verdad en la nube para operar en **Vercel** con máxima disponibilidad global, seguridad reforzada y tiempos de respuesta instantáneos.

---

## 2. Objetivos de Negocio y Métricas de Éxito (KPIs)

1. **Lectura instantánea desde pista o escritorio:** Carga inicial ultrarrápida mediante CSS compilado, imágenes `AVIF`/`WebP` e ISR (*Incremental Static Regeneration*) en la red global Edge de Vercel.
2. **Suite de entrenamiento autónoma (`/cuaderno-tiro`):** Herramientas completas ejecutadas en el navegador del arquero sin requerir registro ni conexión constante.
3. **Captación y atención ágil de alumnos:** Formulario de asesoría protegido conectado a Supabase (`leads_contacto`), avisos opcionales por HTTPS mediante **Resend API** y botón flotante dinámico de WhatsApp.
4. **Autogestión total para el monitor (`/admin`):** Panel privado protegido con cookies `HttpOnly` de Supabase Auth e invalidación instantánea de caché al publicar o editar contenidos.

---

## 3. Requisitos Funcionales del Sistema

### Módulo 1: Directorio y Catálogo General (`/` y `/articulos`)
* **RF-01.1:** Buscador reactivo en cliente por palabras clave en título, subtítulo y resumen sin recargar la página.
* **RF-01.2:** Filtros dinámicos por nivel (*Todos*, *Iniciación*, *Intermedio*, *Avanzado*) y agrupación editorial por categorías con numeración romana (`I..X`).
* **RF-01.3:** Tarjeta destacada en el Hero principal y vista rápida en **modal estricto** con acceso directo a consulta pre-rellenada.
* **RF-01.4:** Acceso visible en cabecera y pie al **Manual de Usuario** integrado en pantalla.

### Módulo 2: Lector de Artículos Técnicos (`/articulo/[slug]`)
* **RF-02.1:** Barra superior dorada de progreso de lectura sincronizada con el scroll.
* **RF-02.2:** Visor integrado de documentos alojados en Google Drive (`/preview`) con botones de apertura externa y descarga directa (`?export=download`), o ficha técnica editorial cuando el artículo no requiere adjunto externo.
* **RF-02.3:** Sugerencia automática de artículos relacionados de la misma categoría y metadatos SEO / OpenGraph dinámicos.

### Módulo 3: Vistas de Categoría (`/categoria/[slug]`)
* **RF-03.1:** Listado completo de las monografías de la categoría con buscador interno, filtro por nivel con contadores y navegación continua al siguiente capítulo del compendio.

### Módulo 4: Contacto, Asesoría y Canal WhatsApp
* **RF-04.1:** Formulario reactivo con validación de campos, doble verificación Anti-CSRF (`Origin` + HMAC-SHA256) y limitador de tasa por IP.
* **RF-04.2:** Inserción directa en Supabase (`leads_contacto`) bajo política RLS blindada (inserción pública permitida, lectura pública bloqueada).
* **RF-04.3:** Notificación por correo electrónico vía HTTPS (**Resend API**) hacia el email configurado por el monitor, sin interrumpir el guardado si la clave de correo no está definida.
* **RF-04.4:** Botón flotante permanente de WhatsApp con animación y globo emergente editable desde `/admin/configuracion`.

### Módulo 5: Panel Privado de Administración (`/admin`)
* **RF-05.1:** Autenticación contra **Supabase Auth** mediante `@supabase/ssr` con sesión en cookies `HttpOnly` protegidas por Middleware.
* **RF-05.2:** Dashboard con indicadores reales de categorías, artículos, consultas sin leer y mensajes respondidos.
* **RF-05.3:** Gestión CRUD completa de **Categorías** (`/admin/categorias`) y **Artículos** (`/admin/articulos`) con ordenación en columnas, paginación de 10 registros, filtros combinados, modales estrictos e invalidación inmediata de caché (`revalidateTag('catalog')`).
* **RF-05.4:** **Buzón de Consultas** (`/admin/mensajes`) con marcado leído/pendiente y respondido/pendiente, borrado confirmado y botones de respuesta en 1 clic por WhatsApp o correo.
* **RF-05.5:** **Ajustes en Vivo** (`/admin/configuracion`) para teléfono E.164, mensaje de bienvenida, tooltip de WhatsApp y correo de notificaciones con vista previa instantánea.

### Módulo 6: Cuaderno de Tiro y Suite de Campo (`/cuaderno-tiro`)
* **RF-06.1:** Diana táctil reglamentaria World Archery en SVG con cálculo euclídeo exacto (`X`, `10..1`, `M`), deshacer impacto y avance automático de tanda.
* **RF-06.2:** Generación e impresión en cliente de informe personalizado en PDF (con diana e impactos vectoriales) y exportación a CSV con BOM UTF-8.
* **RF-06.3:** Tres plantillas oficiales A4 imprimibles en blanco (*Tuning*, Hoja de 20 tandas y Dianas de Agrupación).
* **RF-06.4:** Calculadora de *Spine*, conversor bidireccional exacto (lbs ↔ kg, in ↔ cm, grains ↔ g) y semáforo con cronómetro (120 s / 240 s / 20 s) y silbatos `Web Audio API`.
* **RF-06.5:** Historial privado de sesiones en `localStorage` con recarga en un clic y vaciado protegido por modal estricto.

---

## 4. Requisitos No Funcionales (RNF)

* **RNF-01 (Compatibilidad Serverless):** Cero dependencia del sistema de archivos local en tiempo de ejecución; sesiones y tokens 100 % compatibles con instancias efímeras de Vercel.
* **RNF-02 (Rendimiento y SEO):** Tailwind CSS compilado estáticamente, fuentes auto-hospedadas en build (`next/font`), imágenes modernas `AVIF/WebP`, `sitemap.xml` y `robots.txt`.
* **RNF-03 (Seguridad):** Cabeceras HTTP estrictas (`CSP`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`), RLS activo en todas las tablas y secretos aislados en variables de entorno.
