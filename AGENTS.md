# Directrices de Arquitectura y Reglas de Proyecto (`AGENTS.md` — `DamiaVercel`)

Este documento establece las **reglas técnicas obligatorias** para operar sobre `DamiaVercel`, garantizando compatibilidad 100 % nativa con **Vercel Serverless**, seguridad con **Supabase (PostgreSQL + Auth + RLS)** y máxima velocidad de carga.

---

## 1. Reglas Críticas Innegociables

1. **Arquitectura Serverless Pura (Cero Escritura en Disco Local):**
   * Prohibido guardar cachés, sesiones, contactos o configuraciones en archivos locales del servidor (el sistema de archivos en Vercel es efímero y de solo lectura).
   * Toda la persistencia reside en **Supabase** (`categorias`, `articulos`, `configuracion_web`, `leads_contacto`) y en `localStorage` del navegador para el Cuaderno de Tiro del visitante.
2. **Tipado Estricto y Separación de Capas:**
   * TypeScript en modo `strict: true` obligatorio (`npm run typecheck` debe pasar con 0 errores).
   * Respetar la separación `App Route / Component → Service → Repository → Supabase`.
3. **Zona Horaria Oficial:**
   * Formatear fechas operativas y registros administrativos usando siempre la zona horaria peninsular `Europe/Madrid`.
4. **Seguridad por Defecto:**
   * Nunca guardar claves ni tokens en código fuente ni en archivos versionados en Git (usar variables de entorno en `.env.local` y panel de Vercel).
   * Sesiones del monitor gestionadas exclusivamente con `@supabase/ssr` en cookies `HttpOnly`, protegidas por `src/middleware.ts` y verificadas en servidor con `supabase.auth.getUser()`.
   * Políticas **RLS activas** en todas las tablas de Supabase: el rol `anon` solo puede leer catálogo/configuración pública e insertar consultas en `leads_contacto` (sin permiso `SELECT` sobre datos personales).
   * Validación doble Anti-CSRF (`Origin` + token firmado con `HMAC-SHA256` y `crypto.timingSafeEqual`) en los endpoints mutables.
5. **UX Reactiva, Tablas y Modales Estrictos:**
   * Notificaciones *toast* reactivas (prohibido usar `alert()` o `confirm()` nativos del navegador).
   * **Modales estrictos** en toda la aplicación: jamás se cierran haciendo clic en el fondo oscuro ni pulsando la tecla `Escape`; solo mediante botones explícitos (`Cancelar`, `Cerrar` o `×`).
   * Tablas del panel `/admin` con ordenación en encabezados y paginación ligera sin librerías pesadas.
   * Acceso visible en cabecera y pie para consultar `docs/manual_usuario.md` directamente en pantalla.

---

## 2. Invariantes de Dominio y Cálculos Oficiales

* **Diana Oficial World Archery (`/cuaderno-tiro`):**
  * Cálculo de puntuación por distancia euclídea radial $r = \sqrt{\Delta x^2 + \Delta y^2}$ respecto al radio exterior $R$:
    * Anillo interior `X`: $r \le 0.05 \cdot R$ (10 puntos, etiqueta `X`).
    * Zona `10`: $r \le 0.10 \cdot R$ (10 puntos).
    * Zonas `9` a `1`: pasos sucesivos de $0.10 \cdot R$ hasta $1.00 \cdot R$.
    * Fuera de diana: $r > 1.00 \cdot R$ (0 puntos, etiqueta `M`).
  * Promedios calculados siempre con 2 decimales (`total / flechas`).
* **Constantes Físicas de Conversión:**
  * Potencia: $1\text{ lb} = 0.45359237\text{ kg}$ $\longleftrightarrow$ $1\text{ kg} = 2.20462262\text{ lbs}$.
  * Longitud: $1\text{ in} = 2.54\text{ cm}$ $\longleftrightarrow$ $1\text{ cm} = 0.393700787\text{ in}$.
  * Masa: $1\text{ grain} = 0.06479891\text{ g}$ $\longleftrightarrow$ $1\text{ g} = 15.4323584\text{ grains}$.
* **Formato WhatsApp:** Número normalizado en formato internacional E.164 sin signos ni espacios (ej. `34600000000`) para enlaces `https://wa.me/<telefono>?text=<mensaje_codificado>`.

---

## 3. Protocolo de Verificación y Cierre

Antes de dar por cerrada cualquier modificación en este proyecto:
1. Ejecutar `npm run typecheck` y `npm run build` asegurando compilación limpia sin errores.
2. Si se modifican tablas o políticas en Supabase, ejecutar el linter de seguridad (`get_advisors`) y mantener actualizado `supabase/migrations/`.
3. No dejar registros de prueba residuales en Supabase (*Zero-Pollution*).
4. Mantener sincronizados `README.md`, `AGENTS.md` y `docs/*.md`, comunicando siempre en **español de España** qué se ha hecho, cómo comprobarlo y qué queda pendiente.
