'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { showToast } from '@/components/ui/ToastProvider';
import type { WhatsAppConfig } from '@/types/domain';

export function ConfigAdminClient({
  whatsapp,
  notifEmail,
  csrfToken,
}: {
  whatsapp: WhatsAppConfig;
  notifEmail: string;
  csrfToken: string;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(whatsapp.rawPhone);
  const [tooltip, setTooltip] = useState(whatsapp.tooltip);
  const [message, setMessage] = useState(whatsapp.message);
  const [email, setEmail] = useState(notifEmail);
  const [saving, setSaving] = useState(false);

  let cleanPhone = (phone || '').replace(/\D/g, '');
  if (cleanPhone.length === 9 && ['6', '7', '8', '9'].includes(cleanPhone[0])) {
    cleanPhone = `34${cleanPhone}`;
  }
  const previewUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message || '')}`;
  const previewTooltip =
    tooltip.replace(/\s*¡?Escríbeme!?\s*$/iu, '').trim() || '¿Dudas sobre clases en Mallorca?';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/configuracion/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          whatsapp_telefono: phone,
          whatsapp_tooltip: tooltip,
          whatsapp_mensaje: message,
          notificacion_email: email,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.data?.message || 'Configuración guardada correctamente.', 'success');
        router.refresh();
      } else {
        showToast(json.error || 'Error al guardar la configuración.', 'error');
      }
    } catch {
      showToast('Error de conexión al guardar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-lg border border-light-outline-variant/50 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-light-outline uppercase">
            <Link href="/admin" className="hover:text-gold-accent">
              Admin
            </Link>
            <span>/</span>
            <span className="text-light-on-surface">Configuración</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-light-primary uppercase mt-1">
            Ajustes de WhatsApp y Notificaciones
          </h1>
          <p className="text-sm text-light-outline mt-1">
            Personaliza en tiempo real el botón flotante de WhatsApp y el correo de avisos para nuevas consultas.
          </p>
        </div>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">chat</span>
          <span>Probar Chat Actual</span>
        </a>
      </div>

      <div className="bg-white rounded-lg border border-light-outline-variant/50 shadow-sm p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-light-primary">
              Número de WhatsApp Oficial (con prefijo internacional){' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600">
                <span className="material-symbols-outlined text-lg">call</span>
              </div>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="34600000000"
                className="block w-full rounded-md border-light-outline-variant pl-10 text-sm focus:border-emerald-500 focus:ring-emerald-500 font-mono py-2.5"
              />
            </div>
            <p className="text-xs text-light-outline">
              Introduce el número sin espacios ni signos (formato E.164, ej. <code>34628896526</code>).
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-light-primary">
              Texto del Globo Emergente Flotante <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600">
                <span className="material-symbols-outlined text-lg">chat_bubble</span>
              </div>
              <input
                type="text"
                required
                value={tooltip}
                onChange={(e) => setTooltip(e.target.value)}
                placeholder="¿Dudas sobre clases en Mallorca?"
                className="block w-full rounded-md border-light-outline-variant pl-10 text-sm focus:border-emerald-500 focus:ring-emerald-500 py-2.5"
              />
            </div>
            <p className="text-xs text-light-outline">
              A continuación se añade automáticamente la coletilla destacada{' '}
              <strong>¡Escríbeme!</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-light-primary">
              Mensaje de Bienvenida al abrir WhatsApp <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="block w-full rounded-md border-light-outline-variant text-sm focus:border-emerald-500 focus:ring-emerald-500 py-2.5 px-3"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-light-outline-variant/30">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-light-primary">
              Correo de Recepción de Consultas y Avisos (Resend API)
            </label>
            <div className="relative rounded-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-light-outline">
                <span className="material-symbols-outlined text-lg">mail</span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="damiajr@hotmail.com"
                className="block w-full rounded-md border-light-outline-variant pl-10 text-sm focus:border-light-primary focus:ring-light-primary font-mono py-2.5"
              />
            </div>
          </div>

          {/* Previsualización en vivo */}
          <div className="p-5 rounded-lg bg-light-surface-container-low border border-light-outline-variant/40 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-light-outline">
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span>Previsualización del globo emergente y botón:</span>
            </div>

            <div className="flex items-center justify-end p-4 bg-light-primary rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-light-primary-container text-white text-xs font-semibold border border-emerald-400/30 shadow-lg">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {previewTooltip} <strong className="text-emerald-300">¡Escríbeme!</strong>
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-emerald-400/40">
                  <span className="material-symbols-outlined text-2xl">chat</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase text-light-outline">
                Enlace de apertura generado:
              </span>
              <div className="p-3 bg-white rounded border border-light-outline-variant/50 font-mono text-xs text-light-primary break-all">
                {previewUrl}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-light-outline-variant/40 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-light-primary hover:bg-light-primary-container disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
