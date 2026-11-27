import { NextResponse, type NextRequest } from 'next/server';
import { validateCsrfRequest } from '@/lib/security/csrf';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';
import { submitPublicContact } from '@/services/contact-service';

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Formato JSON inválido.' },
      { status: 400 }
    );
  }

  if (!validateCsrfRequest(request, typeof body.csrf_token === 'string' ? body.csrf_token : undefined)) {
    return NextResponse.json(
      { success: false, error: 'Token CSRF o cabecera de origen no válida. Recarga la página e inténtalo de nuevo.' },
      { status: 403 }
    );
  }

  const ip = getClientIp(request.headers);
  const emailKey = String(body.email || '').trim().toLowerCase();
  const limit = checkRateLimit(`contact:${ip}:${emailKey}`, 5, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Has enviado demasiadas solicitudes seguidas. Espera unos minutos antes de volver a intentarlo.',
      },
      { status: 429 }
    );
  }

  const result = await submitPublicContact(body);
  if (!result.success) {
    return NextResponse.json(
      { success: false, data: result, error: result.message },
      { status: 422 }
    );
  }

  return NextResponse.json({
    success: true,
    data: result,
  });
}
