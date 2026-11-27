'use client';

import { useState } from 'react';
import { showToast } from '@/components/ui/ToastProvider';

export function ContactFormClient({ csrfToken }: { csrfToken: string }) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const nombre = String(formData.get('nombre') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const telefono = String(formData.get('telefono') || '').trim();
    const tipoArco = String(formData.get('tipoArco') || '').trim();
    const modalidad = String(formData.get('modalidad') || '').trim();
    const mensaje = String(formData.get('mensaje') || '').trim();

    if (!nombre || !email || !mensaje) {
      showToast('Por favor, completa los campos requeridos.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ nombre, email, telefono, tipoArco, modalidad, mensaje }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        showToast(result.data?.message || '¡Consulta técnica recibida correctamente!', 'success');
        form.reset();
      } else {
        showToast(
          result.data?.message || result.error || 'Ocurrió un error al procesar la solicitud.',
          'error'
        );
      }
    } catch {
      showToast('No se pudo conectar con el servidor. Revisa tu conexión.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id="contactForm"
      onSubmit={handleSubmit}
      className="bg-light-surface-container-lowest p-8 md:p-10 rounded-sm border border-light-outline-variant shadow-sm flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="contactName" className="font-label text-label-md text-light-on-surface font-semibold">
            Nombre completo <span className="text-light-secondary">*</span>
          </label>
          <input
            type="text"
            id="contactName"
            name="nombre"
            required
            placeholder="Tu nombre y apellidos"
            className="w-full px-4 py-2.5 rounded-sm border border-light-outline-variant bg-light-surface text-light-on-surface font-body text-body-md focus:border-light-primary focus:ring-1 focus:ring-light-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="contactEmail" className="font-label text-label-md text-light-on-surface font-semibold">
            Correo electrónico <span className="text-light-secondary">*</span>
          </label>
          <input
            type="email"
            id="contactEmail"
            name="email"
            required
            placeholder="tu@correo.es"
            className="w-full px-4 py-2.5 rounded-sm border border-light-outline-variant bg-light-surface text-light-on-surface font-body text-body-md focus:border-light-primary focus:ring-1 focus:ring-light-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="contactPhone" className="font-label text-label-md text-light-on-surface font-semibold">
            Teléfono / WhatsApp <span className="text-light-outline font-normal text-xs">(Opcional)</span>
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="telefono"
            placeholder="Ej. 600 000 000"
            className="w-full px-4 py-2.5 rounded-sm border border-light-outline-variant bg-light-surface text-light-on-surface font-body text-body-md focus:border-light-primary focus:ring-1 focus:ring-light-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="contactLevel" className="font-label text-label-md text-light-on-surface font-semibold">
            Nivel de experiencia
          </label>
          <select
            id="contactLevel"
            name="modalidad"
            className="w-full px-4 py-2.5 rounded-sm border border-light-outline-variant bg-light-surface text-light-on-surface font-body text-body-md focus:border-light-primary"
          >
            <option value="Iniciación">Iniciación (menos de 1 año)</option>
            <option value="Intermedio">Intermedio (1 a 3 años)</option>
            <option value="Avanzado">Avanzado / Competición</option>
            <option value="Material">Consulta puesta a punto</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="contactBow" className="font-label text-label-md text-light-on-surface font-semibold">
            Tipo de arco
          </label>
          <select
            id="contactBow"
            name="tipoArco"
            className="w-full px-4 py-2.5 rounded-sm border border-light-outline-variant bg-light-surface text-light-on-surface font-body text-body-md focus:border-light-primary"
          >
            <option value="Recurvo Olímpico">Recurvo Olímpico</option>
            <option value="Compuesto">Arco Compuesto (Poleas)</option>
            <option value="Barebow">Arco Desnudo (Barebow)</option>
            <option value="Tradicional">Tradicional / Longbow</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contactMessage" className="font-label text-label-md text-light-on-surface font-semibold">
          Mensaje o consulta técnica <span className="text-light-secondary">*</span>
        </label>
        <textarea
          id="contactMessage"
          name="mensaje"
          rows={4}
          required
          placeholder="Describe tu duda sobre material, técnica de tiro o sensaciones corporales..."
          className="w-full px-4 py-2.5 rounded-sm border border-light-outline-variant bg-light-surface text-light-on-surface font-body text-body-md focus:border-light-primary focus:ring-1 focus:ring-light-primary"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-sm bg-light-primary hover:bg-light-primary-container disabled:opacity-60 text-white font-label text-label-lg transition-colors cursor-pointer"
        >
          <span>{submitting ? 'Enviando...' : 'Enviar consulta técnica'}</span>
          <span className="material-symbols-outlined text-title-md">
            {submitting ? 'hourglass_empty' : 'send'}
          </span>
        </button>
      </div>
    </form>
  );
}
