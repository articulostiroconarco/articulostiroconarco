import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 horas de validez para formularios abiertos

function getSecret(): string {
  return (
    process.env.CSRF_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'damia-vercel-fallback-csrf-secret-key-2026'
  );
}

/**
 * Genera un token Anti-CSRF firmado criptográficamente con HMAC-SHA256 (100% Stateless para Vercel Serverless).
 */
export function generateCsrfToken(): string {
  const timestamp = Date.now().toString(36);
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${timestamp}.${nonce}`;
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

/**
 * Verifica el token Anti-CSRF con comparación en tiempo constante (timingSafeEqual).
 */
export function verifyCsrfToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [timestampB36, nonce, providedSig] = parts;
  if (!timestampB36 || !nonce || !providedSig) {
    return false;
  }

  const issuedAt = parseInt(timestampB36, 36);
  if (Number.isNaN(issuedAt) || Math.abs(Date.now() - issuedAt) > TOKEN_TTL_MS) {
    return false;
  }

  const expectedSig = crypto
    .createHmac('sha256', getSecret())
    .update(`${timestampB36}.${nonce}`)
    .digest('hex');

  const bufA = Buffer.from(expectedSig, 'utf8');
  const bufB = Buffer.from(providedSig, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Valida simultáneamente la cabecera Origin/Referer y el token X-CSRF-Token.
 */
export function validateCsrfRequest(request: NextRequest, bodyToken?: string): boolean {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (host && originHost !== host) {
        return false;
      }
    } catch {
      return false;
    }
  } else if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (host && refererHost !== host) {
        return false;
      }
    } catch {
      return false;
    }
  }

  const headerToken = request.headers.get('x-csrf-token') || bodyToken || '';
  return verifyCsrfToken(headerToken);
}
