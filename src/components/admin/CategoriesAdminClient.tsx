'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PaginationControls } from '@/components/admin/PaginationControls';
import { StrictModal } from '@/components/admin/StrictModal';
import { showToast } from '@/components/ui/ToastProvider';
import type { RawCategory } from '@/types/domain';

const ICON_MAP: Record<string, string> = {
  'fa-bullseye': 'target',
  'fa-crosshairs': 'target',
  'fa-history': 'history_edu',
  'fa-tools': 'tune',
  'fa-sliders-h': 'tune',
  'fa-dumbbell': 'fitness_center',
  'fa-trophy': 'emoji_events',
  'fa-medal': 'emoji_events',
  'fa-book': 'library_books',
  'fa-folder': 'folder_open',
};

const PRESET_ICONS = [
  'target',
  'history_edu',
  'tune',
  'fitness_center',
  'emoji_events',
  'library_books',
  'psychology',
  'forest',
];

function resolveMaterialIcon(raw: string): string {
  const trimmed = (raw || 'category').trim();
  if (ICON_MAP[trimmed]) return ICON_MAP[trimmed];
  if (trimmed.startsWith('fa-') || trimmed.startsWith('fas ') || trimmed.startsWith('fa ')) {
    return 'category';
  }
  return trimmed || 'category';
}

export function CategoriesAdminClient({
  categories,
  csrfToken,
}: {
  categories: RawCategory[];
  csrfToken: string;
}) {
  const router = useRouter();
  const [sortCol, setSortCol] = useState<'orden' | 'titulo' | 'slug'>('orden');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Estado del modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [slug, setSlug] = useState('');
  const [icono, setIcono] = useState('target');
  const [subtitulo, setSubtitulo] = useState('');
  const [orden, setOrden] = useState(1);
  const [descripcion, setDescripcion] = useState('');

  // Estado del modal eliminar
  const [deleteTarget, setDeleteTarget] = useState<RawCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...categories];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'orden') {
        cmp = Number(a.orden || 0) - Number(b.orden || 0);
      } else {
        cmp = String(a[sortCol] || '').localeCompare(String(b[sortCol] || ''), 'es');
      }
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [categories, sortCol, sortAsc]);

  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (col: 'orden' | 'titulo' | 'slug') => {
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
    setSlug('');
    setIcono('target');
    setSubtitulo('');
    setOrden(categories.length + 1);
    setDescripcion('');
    setModalOpen(true);
  };

  const openEdit = (cat: RawCategory) => {
    setEditId(cat.id);
    setTitulo(cat.titulo || '');
    setSlug(cat.slug || '');
    setIcono(resolveMaterialIcon(cat.icono));
    setSubtitulo(cat.subtitulo || '');
    setOrden(Number(cat.orden || 1));
    setDescripcion(cat.descripcion || '');
    setModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitulo(val);
    if (!editId) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/categorias/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          id: editId,
          titulo,
          slug,
          subtitulo,
          descripcion,
          icono,
          orden,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.data?.message || 'Categoría guardada con éxito.', 'success');
        setModalOpen(false);
        router.refresh();
      } else {
        showToast(json.error || 'Error al guardar la categoría.', 'error');
      }
    } catch {
      showToast('Error de red al guardar la categoría.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/categorias/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast('Categoría eliminada de Supabase.', 'success');
        setDeleteTarget(null);
        router.refresh();
      } else {
        showToast(json.error || 'Error al eliminar categoría.', 'error');
      }
    } catch {
      showToast('Error de red al eliminar categoría.', 'error');
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
            <span className="text-light-on-surface">Categorías</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-light-primary uppercase mt-1">
            Gestión de Categorías
          </h1>
          <p className="text-sm text-light-outline mt-1">
            Organiza las disciplinas y áreas temáticas del portal vinculadas en tiempo real a Supabase.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-light-primary hover:bg-light-primary-container text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>Nueva Categoría</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-light-outline-variant/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-light-outline-variant/40 flex items-center justify-between bg-light-surface-container-low">
          <span className="text-xs font-mono text-light-outline">
            Total: {categories.length} categorías activas
          </span>
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
                  className="py-3 px-4 w-20 text-center sortable-header"
                >
                  Orden
                </th>
                <th className="py-3 px-4 w-16 text-center">Icono</th>
                <th
                  onClick={() => toggleSort('titulo')}
                  aria-sort={
                    sortCol === 'titulo' ? (sortAsc ? 'ascending' : 'descending') : 'none'
                  }
                  className="py-3 px-4 sortable-header"
                >
                  Título y Subtítulo
                </th>
                <th
                  onClick={() => toggleSort('slug')}
                  aria-sort={sortCol === 'slug' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  className="py-3 px-4 sortable-header"
                >
                  Slug URL
                </th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/40 text-sm">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-light-outline text-sm">
                    No hay categorías creadas. Pulsa &ldquo;Nueva Categoría&rdquo; para añadir una.
                  </td>
                </tr>
              ) : (
                paginated.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-light-surface-container-low/60 transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-mono text-xs text-light-outline">
                      #{cat.orden}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="w-9 h-9 mx-auto rounded-lg bg-light-surface-container flex items-center justify-center text-light-primary">
                        <span className="material-symbols-outlined text-lg">
                          {resolveMaterialIcon(cat.icono)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-light-on-surface">{cat.titulo}</div>
                      {cat.subtitulo && (
                        <div className="text-xs text-light-outline">{cat.subtitulo}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-light-outline">{cat.slug}</td>
                    <td className="py-3 px-4 text-xs text-light-on-surface/80 max-w-xs line-clamp-2">
                      {cat.descripcion}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-light-surface-container text-light-primary hover:bg-light-primary hover:text-white transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cat)}
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
          totalItems={sorted.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* Modal Estricto Crear / Editar */}
      <StrictModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Editar Categoría' : 'Nueva Categoría'}
        icon="category"
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-light-on-surface mb-1">
              Título de la Categoría <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ej: Biomecánica y Postura"
              className="w-full px-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary focus:ring-1 focus:ring-light-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-light-on-surface mb-1">
                Slug URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="biomecanica-y-postura"
                className="w-full px-3 py-2 text-sm font-mono rounded border border-light-outline-variant/80 focus:border-light-primary focus:ring-1 focus:ring-light-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-light-on-surface mb-1">Icono</label>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-light-surface-container flex items-center justify-center text-light-primary shrink-0 border border-light-outline-variant/60">
                  <span className="material-symbols-outlined text-xl">
                    {resolveMaterialIcon(icono)}
                  </span>
                </div>
                <input
                  type="text"
                  value={icono}
                  onChange={(e) => setIcono(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm font-mono rounded border border-light-outline-variant/80 focus:border-light-primary focus:ring-1 focus:ring-light-primary"
                />
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-light-surface-container-low border border-light-outline-variant/40">
            <span className="text-[10px] font-mono uppercase text-light-outline font-semibold block mb-1.5">
              Iconos recomendados para tiro con arco:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_ICONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setIcono(preset)}
                  className="px-2 py-1 rounded text-xs bg-white border border-light-outline-variant/60 hover:bg-light-primary hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">{preset}</span>
                  <span>{preset}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-light-on-surface mb-1">
                Subtítulo Breve
              </label>
              <input
                type="text"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                placeholder="Alineación ósea y ciclo de disparo"
                className="w-full px-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary focus:ring-1 focus:ring-light-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-light-on-surface mb-1">Orden</label>
              <input
                type="number"
                min={1}
                value={orden}
                onChange={(e) => setOrden(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary focus:ring-1 focus:ring-light-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-light-on-surface mb-1">
              Descripción
            </label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del enfoque temático..."
              className="w-full px-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary focus:ring-1 focus:ring-light-primary"
            />
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
              <span>{saving ? 'Guardando...' : 'Guardar Categoría'}</span>
            </button>
          </div>
        </form>
      </StrictModal>

      {/* Modal Estricto Eliminar */}
      <StrictModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar Categoría"
        icon="warning"
        variant="danger"
        maxWidthClass="max-w-md"
      >
        <div className="p-6">
          <p className="text-sm text-light-on-surface">
            ¿Seguro que deseas eliminar la categoría{' '}
            <span className="font-semibold text-light-secondary">
              &ldquo;{deleteTarget?.titulo}&rdquo;
            </span>{' '}
            de Supabase?
          </p>
          <p className="text-xs text-light-outline mt-2">
            Asegúrate de que no tenga artículos vinculados.
          </p>
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
              <span>{deleting ? 'Eliminando...' : 'Eliminar Categoría'}</span>
            </button>
          </div>
        </div>
      </StrictModal>
    </div>
  );
}
