'use client';

import { useEffect } from 'react';

interface StrictModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  variant?: 'primary' | 'danger';
  maxWidthClass?: string;
  children: React.ReactNode;
}

/**
 * Modal Estricto: NUNCA se cierra al hacer clic en el fondo ni al pulsar la tecla Escape.
 * Únicamente se cierra mediante el botón explícito (×) o botones de acción internos.
 */
export function StrictModal({
  open,
  onClose,
  title,
  icon = 'edit_document',
  variant = 'primary',
  maxWidthClass = 'max-w-2xl',
  children,
}: StrictModalProps) {
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('overflow-hidden');

    const blockEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', blockEscape, true);

    return () => {
      document.body.classList.remove('overflow-hidden');
      window.removeEventListener('keydown', blockEscape, true);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        className={`relative w-full ${maxWidthClass} bg-white rounded-lg shadow-2xl border border-light-outline-variant/60 overflow-hidden my-8`}
      >
        <div
          className={`${
            variant === 'danger' ? 'bg-red-800' : 'bg-light-primary'
          } text-white p-4 sm:p-5 flex items-center justify-between`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`material-symbols-outlined text-xl ${
                variant === 'danger' ? 'text-white' : 'text-gold-accent'
              }`}
            >
              {icon}
            </span>
            <h3 className="font-display text-xl font-bold uppercase tracking-tight">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
