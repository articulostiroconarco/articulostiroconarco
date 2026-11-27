'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PaginationControls } from '@/components/admin/PaginationControls';
import { StrictModal } from '@/components/admin/StrictModal';
import { showToast } from '@/components/ui/ToastProvider';
import type { LeadRecord } from '@/types/domain';

function cleanWhatsAppPhone(raw: string): string {
  let clean = (raw || '').replace(/\D/g, '');
  if (clean.length === 9 && ['6', '7', '8', '9'].includes(clean[0])) {
    clean = `34${clean}`;
  }
  return clean;
}

export function MessagesAdminClient({
  leads,
  csrfToken,
}: {
  leads: LeadRecord[];
  csrfToken: string;
}) {
  const router = useRouter();
  const [sortCol, setSortCol] = useState<'fecha' | 'nombre' | 'estado'>('fecha');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [viewingLead, setViewingLead] = useState<LeadRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...leads];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'fecha') {
        cmp = String(a.created_at || '').localeCompare(String(b.created_at || ''));
      } else if (sortCol === 'nombre') {
        cmp = String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
      } else {
        cmp = Number(Boolean(a.leido)) - Number(Boolean(b.leido));
      }
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [leads, sortCol, sortAsc]);

  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortAsc((p) => !p);
    } else {
      setSortCol(col);
      setSortAsc(col !== 'fecha');
    }
  };

  const toggleRead = async (id: string, leido: boolean, silent = false) => {
    try {
      const res = await fetch('/api/admin/mensajes/toggle-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ id, leido }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (!silent) showToast(json.data?.message || 'Estado actualizado.', 'success');
        router.refresh();
      } else if (!silent) {
        showToast(json.error || 'Error al actualizar estado.', 'error');
      }
    } catch {
      if (!silent) showToast('Error de conexión.', 'error');
    }
  };

  const toggleResponded = async (id: string, respondido: boolean, silent = false) => {
    try {
      const res = await fetch('/api/admin/mensajes/toggle-responded', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ id, respondido }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (!silent) showToast(json.data?.message || 'Estado de respuesta actualizado.', 'success');
        router.refresh();
      } else if (!silent) {
        showToast(json.error || 'Error al actualizar estado.', 'error');
      }
    } catch {
      if (!silent) showToast('Error de conexión.', 'error');
    }
  };

  const openLeadModal = (lead: LeadRecord) => {
    setViewingLead(lead);
    if (!lead.leido) {
      toggleRead(lead.id, true, true);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/mensajes/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast('Mensaje eliminado del buzón.', 'success');
        setDeleteTarget(null);
        router.refresh();
      } else {
        showToast(json.error || 'Error al eliminar el mensaje.', 'error');
      }
    } catch {
      showToast('Error de red al eliminar el mensaje.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const viewingCleanPhone = viewingLead?.telefono ? cleanWhatsAppPhone(viewingLead.telefono) : '';
  const viewingWaUrl = viewingCleanPhone
    ? `https://wa.me/${viewingCleanPhone}?text=${encodeURIComponent(
        `Hola ${viewingLead?.nombre || ''}, te contacto respecto a tu consulta en Artículos de Tiro con Arco sobre "${
          viewingLead?.motivo || 'asesoría técnica'
        }".`
      )}`
    : '';
  const viewingMailUrl = viewingLead
    ? `mailto:${viewingLead.email}?subject=${encodeURIComponent(
        'Re: Consulta técnica de Tiro con Arco — Damià Juan Ramis'
      )}`
    : '#';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-lg border border-light-outline-variant/50 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-light-outline uppercase">
            <Link href="/admin" className="hover:text-gold-accent">
              Admin
            </Link>
            <span>/</span>
            <span className="text-light-on-surface">Buzón de Consultas</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-light-primary uppercase mt-1">
            Buzón de Consultas y Solicitudes
          </h1>
          <p className="text-sm text-light-outline mt-1">
            Mensajes recibidos desde el formulario público, protegidos con políticas RLS privadas en Supabase.
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-light-surface-container text-light-primary font-semibold self-start sm:self-auto">
          Total: {leads.length} mensajes
        </span>
      </div>

      <div className="bg-white rounded-lg border border-light-outline-variant/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-light-surface-container text-light-on-surface text-[11px] font-mono uppercase tracking-wider border-b border-light-outline-variant/60">
                <th
                  onClick={() => toggleSort('estado')}
                  aria-sort={
                    sortCol === 'estado' ? (sortAsc ? 'ascending' : 'descending') : 'none'
                  }
                  className="py-3 px-4 sortable-header"
                >
                  Estado
                </th>
                <th
                  onClick={() => toggleSort('nombre')}
                  aria-sort={
                    sortCol === 'nombre' ? (sortAsc ? 'ascending' : 'descending') : 'none'
                  }
                  className="py-3 px-4 sortable-header"
                >
                  Remitente y Contacto
                </th>
                <th className="py-3 px-4">Motivo / Modalidad</th>
                <th className="py-3 px-4">Mensaje</th>
                <th
                  onClick={() => toggleSort('fecha')}
                  aria-sort={
                    sortCol === 'fecha' ? (sortAsc ? 'ascending' : 'descending') : 'none'
                  }
                  className="py-3 px-4 sortable-header"
                >
                  Fecha
                </th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/40 text-sm">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-light-outline text-sm">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50 block">
                      inbox
                    </span>
                    No has recibido ninguna consulta todavía.
                  </td>
                </tr>
              ) : (
                paginated.map((lead) => {
                  const isUnread = !lead.leido;
                  const isResponded = Boolean(lead.respondido);
                  const cleanPhone = lead.telefono ? cleanWhatsAppPhone(lead.telefono) : '';
                  const waUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                        `Hola ${lead.nombre || ''}, te contacto respecto a tu consulta en Artículos de Tiro con Arco.`
                      )}`
                    : '';

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-light-surface-container-low/60 transition-colors ${
                        isUnread ? 'bg-amber-50/40 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {isUnread ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-light-secondary text-white uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              <span>Nuevo</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-light-outline">Leído</span>
                          )}
                          {isResponded && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <span className="material-symbols-outlined text-[12px]">done_all</span>
                              <span>Respondido</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-light-on-surface">
                          {lead.nombre || 'Anónimo'}
                        </div>
                        <div className="text-xs text-light-outline flex flex-wrap items-center gap-2">
                          <a
                            href={`mailto:${lead.email}`}
                            className="hover:text-gold-accent hover:underline"
                          >
                            {lead.email}
                          </a>
                          {waUrl && (
                            <>
                              <span>•</span>
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold text-xs"
                              >
                                <span className="material-symbols-outlined text-xs">chat</span>
                                <span>{lead.telefono}</span>
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-light-primary">
                        {lead.motivo || 'Asesoría'}
                      </td>
                      <td className="py-3 px-4 text-xs text-light-on-surface/80 max-w-xs">
                        <div className="line-clamp-2">{lead.mensaje}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-light-outline whitespace-nowrap">
                        {(lead.created_at || '').replace('T', ' ').slice(0, 16)}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openLeadModal(lead)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-light-primary text-white hover:bg-light-primary-container transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>Leer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleResponded(lead.id, !isResponded)}
                          title={
                            isResponded
                              ? 'Marcar como pendiente de respuesta'
                              : 'Marcar como respondido'
                          }
                          className={`inline-flex items-center p-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                            isResponded
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-light-surface-container text-light-outline hover:text-emerald-700'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {isResponded ? 'mark_chat_read' : 'chat'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleRead(lead.id, isUnread)}
                          title={isUnread ? 'Marcar como leído' : 'Marcar como no leído'}
                          className="inline-flex items-center p-1 rounded text-xs font-medium bg-light-surface-container text-light-primary hover:bg-light-outline-variant transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {isUnread ? 'mark_email_read' : 'mark_email_unread'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(lead)}
                          title="Eliminar mensaje"
                          className="inline-flex items-center p-1 rounded text-xs font-medium bg-red-50 text-light-secondary hover:bg-light-secondary hover:text-white transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
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

      {/* Modal Estricto de Lectura y Respuesta */}
      <StrictModal
        open={Boolean(viewingLead)}
        onClose={() => setViewingLead(null)}
        title="Detalle de Consulta"
        icon="mark_email_read"
        maxWidthClass="max-w-lg"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between border-b border-light-outline-variant/40 pb-4">
            <div>
              <h4 className="text-base font-bold text-light-primary">{viewingLead?.nombre}</h4>
              <p className="text-xs text-light-outline mt-0.5">{viewingLead?.email}</p>
              {viewingLead?.telefono && (
                <p className="text-xs text-light-outline">Tel: {viewingLead.telefono}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-light-outline">
                {(viewingLead?.created_at || '').replace('T', ' ').slice(0, 16)}
              </span>
              <div className="mt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-light-surface-container text-light-primary">
                  {viewingLead?.motivo || 'Asesoría técnica'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <span className="block text-xs font-mono uppercase text-light-outline mb-1">
              Mensaje del Arquero:
            </span>
            <div className="p-4 rounded bg-light-surface-container-low text-sm text-light-on-surface whitespace-pre-wrap leading-relaxed border border-light-outline-variant/40 max-h-60 overflow-y-auto">
              {viewingLead?.mensaje}
            </div>
          </div>

          <div className="pt-4 border-t border-light-outline-variant/40 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setViewingLead(null)}
              className="px-4 py-2 rounded text-xs font-medium text-light-outline hover:text-light-on-surface hover:bg-light-surface-container transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <div className="flex items-center gap-2">
              {viewingWaUrl && viewingLead && (
                <a
                  href={viewingWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => toggleResponded(viewingLead.id, true, true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">chat</span>
                  <span>Responder por WhatsApp</span>
                </a>
              )}
              {viewingLead && (
                <a
                  href={viewingMailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => toggleResponded(viewingLead.id, true, true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-gold-accent hover:bg-gold-accent/90 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">reply</span>
                  <span>Responder por Correo</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </StrictModal>

      {/* Modal Estricto Eliminar */}
      <StrictModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar Mensaje"
        icon="warning"
        variant="danger"
        maxWidthClass="max-w-md"
      >
        <div className="p-6">
          <p className="text-sm text-light-on-surface">
            ¿Deseas eliminar permanentemente la consulta de{' '}
            <span className="font-semibold text-light-secondary">
              &ldquo;{deleteTarget?.nombre}&rdquo;
            </span>
            ?
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
              <span>{deleting ? 'Eliminando...' : 'Eliminar'}</span>
            </button>
          </div>
        </div>
      </StrictModal>
    </div>
  );
}
