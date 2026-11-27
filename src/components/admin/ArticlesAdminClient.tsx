'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PaginationControls } from '@/components/admin/PaginationControls';
import { StrictModal } from '@/components/admin/StrictModal';
import { showToast } from '@/components/ui/ToastProvider';
import type { RawArticle, RawCategory } from '@/types/domain';

export function ArticlesAdminClient({
  articles,
  categories,
  csrfToken,
}: {
  articles: RawArticle[];
  categories: RawCategory[];
  csrfToken: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [sortCol, setSortCol] = useState<'orden' | 'titulo' | 'categoria' | 'destacado'>('orden');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [categoriaId, setCategoriaId] = useState(categories[0]?.id || 'cat-1');
  const [subtitulo, setSubtitulo] = useState('');
  const [resumen, setResumen] = useState('');
  const [autor, setAutor] = useState('Damiá Juan Ramis');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [orden, setOrden] = useState(1);
  const [driveUrl, setDriveUrl] = useState('');
  const [tipoArchivo, setTipoArchivo] = useState('PDF');
  const [destacado, setDestacado] = useState(false);

  // Modal eliminar
  const [deleteTarget, setDeleteTarget] = useState<RawArticle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const catMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of categories) {
      m[c.id] = c.titulo;
    }
    return m;
  }, [categories]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = articles.filter((art) => {
      if (catFilter && art.categoria_id !== catFilter) return false;
      if (featuredFilter === '1' && !art.destacado) return false;
      if (featuredFilter === '0' && art.destacado) return false;
      if (!q) return true;
      const haystack = `${art.titulo || ''} ${art.subtitulo || ''} ${art.resumen || ''}`.toLowerCase();
      return haystack.includes(q);
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'orden') {
        cmp = Number(a.orden || 0) - Number(b.orden || 0);
      } else if (sortCol === 'titulo') {
        cmp = String(a.titulo || '').localeCompare(String(b.titulo || ''), 'es');
      } else if (sortCol === 'categoria') {
        cmp = String(catMap[a.categoria_id] || '').localeCompare(
          String(catMap[b.categoria_id] || ''),
          'es'
        );
      } else if (sortCol === 'destacado') {
        cmp = Number(Boolean(b.destacado)) - Number(Boolean(a.destacado));
      }
      return sortAsc ? cmp : -cmp;
    });

    return filtered;
  }, [articles, search, catFilter, featuredFilter, sortCol, sortAsc, catMap]);

  const paginated = filteredAndSorted.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters = search !== '' || catFilter !== '' || featuredFilter !== '';

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortAsc((p) => !p);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const openNew = () => {
    setEditId('');
    setTitulo('');
    setCategoriaId(categories[0]?.id || 'cat-1');
    setSubtitulo('');
    setResumen('');
    setAutor('Damiá Juan Ramis');
    setFecha(new Date().toISOString().slice(0, 10));
    setOrden(1);
    setDriveUrl('');
    setTipoArchivo('PDF');
    setDestacado(false);
    setModalOpen(true);
  };

  const openEdit = (art: RawArticle) => {
    setEditId(art.id);
    setTitulo(art.titulo || '');
    setCategoriaId(art.categoria_id || categories[0]?.id || 'cat-1');
    setSubtitulo(art.subtitulo || '');
    setResumen(art.resumen || '');
    setAutor(art.autor || 'Damiá Juan Ramis');
    setFecha(art.fecha || new Date().toISOString().slice(0, 10));
    setOrden(Number(art.orden || 1));
    setDriveUrl(art.drive_url || '');
    const rawTipo = (art.tipo_archivo || '').toUpperCase().trim();
    setTipoArchivo(rawTipo === 'GUÍA' ? 'GUIA' : rawTipo === 'VÍDEO' ? 'VIDEO' : rawTipo);
    setDestacado(Boolean(art.destacado));
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/articulos/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          id: editId,
          titulo,
          categoria_id: categoriaId,
          subtitulo,
          resumen,
          autor,
          fecha,
          orden,
          drive_url: driveUrl,
          tipo_archivo: tipoArchivo,
          destacado,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.data?.message || 'Artículo guardado con éxito.', 'success');
        setModalOpen(false);
        router.refresh();
      } else {
        showToast(json.error || 'Error al guardar el artículo.', 'error');
      }
    } catch {
      showToast('Error de red al guardar el artículo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/articulos/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast('Artículo eliminado de Supabase.', 'success');
        setDeleteTarget(null);
        router.refresh();
      } else {
        showToast(json.error || 'Error al eliminar artículo.', 'error');
      }
    } catch {
      showToast('Error de red al eliminar artículo.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-lg border border-light-outline-variant/50 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-light-outline uppercase">
            <Link href="/admin" className="hover:text-gold-accent">
              Admin
            </Link>
            <span>/</span>
            <span className="text-light-on-surface">Artículos</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-light-primary uppercase mt-1">
            Gestión de Artículos
          </h1>
          <p className="text-sm text-light-outline mt-1">
            Crea, actualiza o elimina monografías técnicas en Supabase con revalidación instantánea.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-light-primary hover:bg-light-primary-container text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>Nuevo Artículo</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-light-outline-variant/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-light-outline-variant/40 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-light-surface-container-low">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-light-outline">
                <span className="material-symbols-outlined text-sm">search</span>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por título o contenido..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-light-outline-variant/80 focus:border-light-primary focus:ring-1 focus:ring-light-primary bg-white"
              />
            </div>

            <select
              value={catFilter}
              onChange={(e) => {
                setCatFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto min-w-[180px] px-3 py-1.5 text-xs rounded border border-light-outline-variant/80 focus:border-light-primary bg-white"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titulo}
                </option>
              ))}
            </select>

            <select
              value={featuredFilter}
              onChange={(e) => {
                setFeaturedFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto min-w-[160px] px-3 py-1.5 text-xs rounded border border-light-outline-variant/80 focus:border-light-primary bg-white"
            >
              <option value="">Todos los artículos</option>
              <option value="1">Solo Destacados (⭐)</option>
              <option value="0">Solo Estándar</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCatFilter('');
                  setFeaturedFilter('');
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-light-secondary hover:bg-light-secondary/10 rounded transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                <span>Limpiar</span>
              </button>
            )}
          </div>

          <div className="shrink-0 text-right">
            <span className="text-xs font-mono text-light-outline">
              {hasFilters
                ? `Mostrando ${filteredAndSorted.length} de ${articles.length} artículos`
                : `Total: ${articles.length} artículos`}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-light-surface-container text-light-on-surface text-[11px] font-mono uppercase tracking-wider border-b border-light-outline-variant/60">
                <th
                  onClick={() => toggleSort('orden')}
                  aria-sort={
                    sortCol === 'orden' ? (sortAsc ? 'ascending' : 'descending') : 'none'
                  }
                  className="py-3 px-4 sortable-header"
                >
                  Orden
                </th>
                <th
                  onClick={() => toggleSort('titulo')}
                  aria-sort={
                    sortCol === 'titulo' ? (sortAsc ? 'ascending' : 'descending') : 'none'
                  }
                  className="py-3 px-4 sortable-header"
                >
                  Título y Resumen
                </th>
                <th
                  onClick={() => toggleSort('categoria')}
                  aria-sort={
                    sortCol === 'categoria' ? (sortAsc ? 'ascending' : 'descending') : 'none'
                  }
                  className="py-3 px-4 sortable-header"
                >
                  Categoría
                </th>
                <th className="py-3 px-4">Tipo / Drive</th>
                <th
                  onClick={() => toggleSort('destacado')}
                  aria-sort={
                    sortCol === 'destacado' ? (sortAsc ? 'ascending' : 'descending') : 'none'
                  }
                  className="py-3 px-4 sortable-header"
                >
                  Destacado
                </th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/40 text-sm">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-light-outline text-sm">
                    {articles.length === 0
                      ? 'No hay artículos en Supabase todavía.'
                      : 'No se han encontrado artículos que coincidan con los filtros seleccionados.'}
                  </td>
                </tr>
              ) : (
                paginated.map((art) => (
                  <tr
                    key={art.id}
                    className="hover:bg-light-surface-container-low/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-light-outline">
                      #{art.orden || 1}
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-semibold text-light-on-surface">{art.titulo}</div>
                      {art.subtitulo && (
                        <div className="text-xs text-light-outline line-clamp-1">
                          {art.subtitulo}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium">
                      <span className="px-2 py-0.5 rounded bg-light-surface-container text-light-primary">
                        {catMap[art.categoria_id] || art.categoria_id || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {art.drive_url ? (
                        <a
                          href={art.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-gold-accent hover:underline font-mono"
                        >
                          <span className="material-symbols-outlined text-sm">attach_file</span>
                          <span>{art.tipo_archivo || 'DOC'}</span>
                        </a>
                      ) : (
                        <span className="text-light-outline font-mono text-[11px]">
                          {art.tipo_archivo || '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {art.destacado ? (
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800">
                          SÍ
                        </span>
                      ) : (
                        <span className="text-light-outline text-xs">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(art)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-light-surface-container text-light-primary hover:bg-light-primary hover:text-white transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(art)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-red-50 text-light-secondary hover:bg-light-secondary hover:text-white transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        <span>Eliminar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          currentPage={page}
          totalItems={filteredAndSorted.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* Modal Estricto Crear / Editar Artículo */}
      <StrictModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Editar Artículo' : 'Nuevo Artículo'}
        icon="edit_document"
      >
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-light-on-surface mb-1">
                Título del Artículo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary focus:ring-1 focus:ring-light-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-light-on-surface mb-1">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-light-on-surface mb-1">
              Subtítulo o Frase Clave
            </label>
            <input
              type="text"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              placeholder="Ej: Alineación de culatín y ajuste dinámico del botón de presión"
              className="w-full px-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-light-on-surface mb-1">
              Resumen / Contenido Técnico
            </label>
            <textarea
              rows={4}
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
              placeholder="Descripción detallada del procedimiento o contenido del artículo..."
              className="w-full px-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-light-on-surface mb-1">Autor</label>
              <input
                type="text"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-light-on-surface mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-light-on-surface mb-1">
                Orden de Presentación
              </label>
              <input
                type="number"
                min={1}
                value={orden}
                onChange={(e) => setOrden(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-light-on-surface mb-1">
                Enlace a Google Drive o Documento{' '}
                <span className="text-xs font-normal text-light-outline">(Opcional)</span>
              </label>
              <input
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-light-on-surface mb-1">
                Tipo de Documento{' '}
                <span className="text-xs font-normal text-light-outline">(Opcional)</span>
              </label>
              <select
                value={tipoArchivo}
                onChange={(e) => setTipoArchivo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary"
              >
                <option value="">-- Sin documento --</option>
                <option value="PDF">PDF</option>
                <option value="GUIA">Guía</option>
                <option value="DOC">Documento</option>
                <option value="FICHA">Ficha Técnica</option>
                <option value="VIDEO">Vídeo</option>
                <option value="LINK">Enlace Externo</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="art-destacado-chk"
              checked={destacado}
              onChange={(e) => setDestacado(e.target.checked)}
              className="rounded border-light-outline-variant/80 text-light-primary focus:ring-light-primary"
            />
            <label htmlFor="art-destacado-chk" className="text-xs font-semibold text-light-on-surface">
              Marcar como Artículo Destacado
            </label>
          </div>

          <div className="pt-4 border-t border-light-outline-variant/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded text-xs font-medium text-light-outline hover:text-light-on-surface hover:bg-light-surface-container transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded bg-light-primary hover:bg-light-primary-container disabled:opacity-60 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span>{saving ? 'Guardando...' : 'Guardar Artículo'}</span>
            </button>
          </div>
        </form>
      </StrictModal>

      {/* Modal Estricto Eliminar */}
      <StrictModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar Eliminación"
        icon="warning"
        variant="danger"
        maxWidthClass="max-w-md"
      >
        <div className="p-6">
          <p className="text-sm text-light-on-surface">
            ¿Estás seguro de que deseas eliminar permanentemente el artículo{' '}
            <span className="font-semibold text-light-secondary">
              &ldquo;{deleteTarget?.titulo}&rdquo;
            </span>{' '}
            de Supabase?
          </p>
          <p className="text-xs text-light-outline mt-2">Esta acción no se puede deshacer.</p>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded text-xs font-medium text-light-outline hover:text-light-on-surface hover:bg-light-surface-container transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="px-4 py-2 rounded bg-light-secondary hover:bg-red-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">delete_forever</span>
              <span>{deleting ? 'Eliminando...' : 'Eliminar Definitivamente'}</span>
            </button>
          </div>
        </div>
      </StrictModal>
    </div>
  );
}
