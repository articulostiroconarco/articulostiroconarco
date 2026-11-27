-- Migración no destructiva de Seguridad RLS e Índices de Rendimiento para Vercel (DamiaVercel)
-- Aplicada sobre el proyecto Supabase activo: sjoxbugxwqpvddjzvsfs

-- 1. Índices adicionales de rendimiento
CREATE INDEX IF NOT EXISTS idx_categorias_orden ON public.categorias USING btree (orden);
CREATE INDEX IF NOT EXISTS idx_leads_contacto_created_at ON public.leads_contacto USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articulos_destacado_orden ON public.articulos USING btree (orden) WHERE destacado = true;

-- 2. Restricción de escritura en categorías al administrador autenticado (no anónimo)
ALTER POLICY "Inserción de categorías" ON public.categorias
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL AND COALESCE(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

ALTER POLICY "Actualización de categorías" ON public.categorias
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND COALESCE(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false)
  WITH CHECK ((select auth.uid()) IS NOT NULL AND COALESCE(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

ALTER POLICY "Eliminación de categorías" ON public.categorias
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND COALESCE(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

-- 3. Restricción de escritura en artículos al administrador autenticado (no anónimo)
ALTER POLICY "Inserción de artículos" ON public.articulos
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL AND COALESCE(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

ALTER POLICY "Actualización de artículos" ON public.articulos
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND COALESCE(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false)
  WITH CHECK ((select auth.uid()) IS NOT NULL AND COALESCE(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

ALTER POLICY "Eliminación de artículos" ON public.articulos
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND COALESCE(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

-- 4. Restricción de modificación en configuracion_web al administrador autenticado
ALTER POLICY "Modificación de configuracion" ON public.configuracion_web
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND COALESCE(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false)
  WITH CHECK ((select auth.uid()) IS NOT NULL AND COALESCE(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

-- 5. Blindaje de leads_contacto: público solo inserta con validación mínima; solo admin lee/edita/elimina
ALTER POLICY "Inserción pública de mensajes de contacto" ON public.leads_contacto
  TO anon, authenticated
  WITH CHECK (
    char_length(btrim(nombre)) >= 2
    AND char_length(btrim(email)) >= 5
    AND char_length(btrim(mensaje)) >= 10
  );

ALTER POLICY "Lectura y gestión de leads" ON public.leads_contacto
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND COALESCE(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false)
  WITH CHECK ((select auth.uid()) IS NOT NULL AND COALESCE(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);
