# Manual de Usuario — Artículos de Tiro con Arco

Guía rápida de navegación del archivo técnico editorial, la suite interactiva de entrenamiento en campo y el panel de gestión del monitor.

---

## 1. Navegación Principal

Desde la barra superior fija puedes acceder en cualquier momento a:
* **Artículos:** Directorio temático completo organizado por capítulos en números romanos (`I` a `V`), con buscador reactivo y filtro por niveles.
* **Cuaderno de tiro:** Suite gratuita de herramientas de pista (diana interactiva, fichas y plantillas PDF, exportación CSV, calculadora de *spine*, conversor físico, semáforo con silbatos e historial privado).
* **El instructor:** Trayectoria docente y metodología técnica de Damiá Juan Ramis (Entrenador Nacional RFETA).
* **Contacto / Asesoría:** Formulario directo para consultas técnicas, puesta a punto o sesiones presenciales y en vídeo.
* **Manual:** Abre esta guía en pantalla dentro de una ventana de consulta sin salir de la página en la que estés.
* **Botón Flotante de WhatsApp:** Esquina inferior derecha para abrir conversación directa en WhatsApp con un clic.

---

## 2. Catálogo, Búsqueda y Lectura de Monografías

1. **Filtrado instantáneo:** En la portada puedes combinar los botones de nivel (*Todos*, *Iniciación*, *Intermedio*, *Avanzado*) con el cuadro de búsqueda rápida por conceptos (`escápula`, `clicker`, `spine`, `tiller`...).
2. **Vista rápida:** Pulsa el icono del ojo en cualquier artículo para abrir su resumen en ventana modal y, si lo deseas, saltar directamente al formulario con el título del artículo ya preparado.
3. **Lectura completa (`/articulo/...`):** Incluye barra superior dorada de progreso de lectura, visor integrado de Google Drive con descarga directa en PDF y sugerencias para continuar en la misma categoría.

---

## 3. Cuaderno de Tiro y Suite de Campo (`/cuaderno-tiro`)

Todo lo que anotes en el Cuaderno de Tiro se procesa de forma 100 % privada en tu propio teléfono u ordenador:

* **Pestaña 1 · Ficha y Diana Táctil:**
  * Selecciona la tanda activa y toca o haz clic en la diana World Archery para registrar cada flecha (`X`, `10` a `1` o `M`). Al completar la 6ª flecha, el cuaderno avanza automáticamente a la siguiente tanda.
  * Anota tus reglajes de *fistmelo*, *tiller*, potencia, flechas, botón y visor.
  * Pulsa **Guardar en Historial**, **Exportar CSV** (compatible con Excel) o **Descargar PDF** para imprimir la hoja técnica con el dibujo de tu agrupación de impactos.
* **Pestaña 2 · Plantillas PDF en Blanco:** Imprime o guarda en A4 la *Ficha de Tuning*, la *Hoja Oficial de 20 Tandas* o las *4 Dianas de Agrupación*.
* **Pestaña 3 · Herramientas de Galería:**
  * **Calculadora de Spine:** Obtén el rango recomendado según tu tipo de arco, potencia real, longitud de tubo y peso de punta.
  * **Conversor de Medidas:** Convierte al instante libras ↔ kilos, pulgadas ↔ centímetros y *grains* ↔ gramos.
  * **Semáforo con Silbatos Oficiales:** Temporizador de 120 s, 240 s o 20 s con luces reglamentarias y pitidos de juez (2 pitidos llamada a línea, 1 inicio de tiro, 3 fin de tanda y 4 parada de emergencia).
* **Pestaña 4 · Mi Historial:** Recarga en el formulario cualquier entrenamiento guardado anteriormente o exporta todo tu historial a CSV.

---

## 4. Panel Privado del Monitor (`/admin`)

Reservado para el entrenador mediante correo y contraseña de Supabase Auth:
* **Inicio (`/admin`):** Resumen de categorías, artículos publicados, consultas nuevas sin leer y consultas respondidas.
* **Categorías (`/admin/categorias`) y Artículos (`/admin/articulos`):** Alta, edición y eliminación mediante ventanas modales seguras que evitan cierres accidentales. Al guardar cualquier cambio, la web pública se actualiza al instante.
* **Buzón de Consultas (`/admin/mensajes`):** Lectura detallada de cada mensaje con botones para responder en un clic por **WhatsApp** o **Correo electrónico**, marcando automáticamente la consulta como leída y respondida.
* **WhatsApp y Ajustes (`/admin/configuracion`):** Modificación en directo del teléfono oficial, el texto del globo emergente, el mensaje inicial de WhatsApp y el correo de avisos, con previsualización interactiva antes de guardar.
