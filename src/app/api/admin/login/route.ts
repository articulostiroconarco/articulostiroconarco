import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validateCsrfRequest } from '@/lib/security/csrf';
import { checkRateLimit, clearRateLimit, getClientIp } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Formato de petición no válido.' }, { status: 400 });
  }

  if (!validateCsrfRequest(request, typeof body.csrf_token === 'string' ? body.csrf_token : undefined)) {
    return NextResponse.json(
      { success: false, error: 'Token de seguridad caducado o inválido. Recarga la página.' },
      { status: 403 }
    );
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '').trim();

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: 'Introduce tu correo y contraseña.' },
      { status: 422 }
    );
  }

  const ip = getClientIp(request.headers);
  const rateKey = `login:${ip}:${email}`;
  const limit = checkRateLimit(rateKey, 5, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Demasiados intentos fallidos. Espera 5 minutos antes de volver a probar.' },
      { status: 429 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.user) {
    return NextResponse.json(
      { success: false, error: 'Credenciales no válidas. Revisa el correo y la contraseña.' },
      { status: 401 }
    );
  }

  clearRateLimit(rateKey);

  return NextResponse.json({
    success: true,
    data: {
      redirect: '/admin',
      email: data.user.email,
    },
  });
}
