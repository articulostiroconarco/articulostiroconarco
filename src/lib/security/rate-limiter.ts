interface Bucket {
  attempts: number;
  firstAttemptAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Limitador de tasa ligero compatible con funciones Serverless en Vercel.
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts = 6,
  windowMs = 5 * 60 * 1000
): { allowed: boolean; remaining: number } {
  const now = Date.now();

  // Limpieza oportunista para evitar crecimiento en instancias calientes
  if (buckets.size > 500) {
    for (const [key, val] of buckets.entries()) {
      if (now - val.firstAttemptAt > windowMs) {
        buckets.delete(key);
      }
    }
  }

  const existing = buckets.get(identifier);
  if (!existing || now - existing.firstAttemptAt > windowMs) {
    buckets.set(identifier, { attempts: 1, firstAttemptAt: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (existing.attempts >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  existing.attempts += 1;
  return { allowed: true, remaining: Math.max(0, maxAttempts - existing.attempts) };
}

export function clearRateLimit(identifier: string): void {
  buckets.delete(identifier);
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return headers.get('x-real-ip') || '127.0.0.1';
}
