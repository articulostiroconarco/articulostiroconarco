'use client';

import { useEffect, useRef, useState } from 'react';

export function ManualModalButton({ variant = 'header' }: { variant?: 'header' | 'footer' }) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    // Modal estricto: impedir cierre con tecla Escape
    const onCancel = (e: Event) => e.preventDefault();
    dlg.addEventListener('cancel', onCancel);
    return () => dlg.removeEventListener('cancel', onCancel);
  }, []);

  const openModal = async () => {
    dialogRef.current?.showModal();
    if (!markdown) {
      setLoading(true);
      try {
        const res = await fetch('/api/manual');
        const json = await res.json();
        setMarkdown(json?.data?.markdown || 'Manual de usuario no disponible.');
      } catch {
        setMarkdown('Error al cargar el manual de usuario.');
      } finally {
        setLoading(false);
      }
    }
  };

  const closeModal = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={openModal}
          className="font-label text-label-md text-light-on-surface-variant hover:text-light-primary transition-colors inline-flex items-center gap-1 cursor-pointer"
          title="Abrir Manual de Usuario en pantalla"
        >
          <span className="material-symbols-outlined text-sm text-gold-accent">help</span>
          <span>Manual</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={openModal}
          className="hover:text-gold-accent transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-xs">help</span>
          <span>Manual de Usuario</span>
        </button>
      )}

      <dialog
        ref={dialogRef}
        className="w-[calc(100%-2rem)] max-w-3xl rounded-sm bg-light-surface-container-lowest border border-light-outline-variant p-0 text-light-on-surface m-auto shadow-2xl backdrop:bg-black/55"
      >
        <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-light-outline-variant bg-light-primary text-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gold-accent">menu_book</span>
            <h2 className="font-headline text-headline-sm uppercase tracking-tight">
              Manual de Usuario · Guía del Portal
            </h2>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Cerrar manual de usuario"
            className="inline-flex items-center justify-center w-9 h-9 rounded-sm hover:bg-white/10 text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="px-6 sm:px-8 py-6 max-h-[68vh] overflow-y-auto bg-white text-light-on-surface">
          {loading ? (
            <p className="font-mono text-xs text-light-outline py-8 text-center">
              Cargando manual de usuario...
            </p>
          ) : (
            <div className="prose max-w-none font-body text-body-sm leading-relaxed whitespace-pre-wrap text-light-on-surface">
              {markdown}
            </div>
          )}
        </div>

        <footer className="px-6 py-4 border-t border-light-outline-variant bg-light-surface-container-low flex justify-end">
          <button
            type="button"
            onClick={closeModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-sm bg-light-primary text-white hover:bg-light-primary-container font-label text-label-md transition-colors cursor-pointer"
          >
            <span>Cerrar manual</span>
          </button>
        </footer>
      </dialog>
    </>
  );
}
