'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { showToast } from '@/components/ui/ToastProvider';

export function LoginClient({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('articulostiroconarco@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast('Sesión iniciada correctamente.', 'success');
        router.push('/admin');
        router.refresh();
      } else {
        const msg = json.error || 'Credenciales no válidas.';
        setError(msg);
        showToast(msg, 'error');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-light-background font-body text-light-on-surface">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-light-outline-variant/60 overflow-hidden">
        <div className="bg-light-primary text-white p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-light-primary-container border border-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-gold-accent text-2xl">sports_score</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight uppercase">
            Panel de Control
          </h1>
          <p className="text-xs text-white/70 mt-1">
            Acceso privado para el monitor técnico (Damià Juan Ramis)
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-light-on-surface mb-1">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-light-outline">
                  <span className="material-symbols-outlined text-sm">mail</span>
                </span>
                <input
                  type="email"
                  id="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary focus:ring-1 focus:ring-light-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-light-on-surface mb-1">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-light-outline">
                  <span className="material-symbols-outlined text-sm">lock</span>
                </span>
                <input
                  type="password"
                  id="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña de Supabase Auth"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded border border-light-outline-variant/80 focus:border-light-primary focus:ring-1 focus:ring-light-primary transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded bg-light-primary hover:bg-light-primary-container disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">login</span>
                <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-light-outline-variant/40 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-light-outline hover:text-light-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Volver al portal público</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
