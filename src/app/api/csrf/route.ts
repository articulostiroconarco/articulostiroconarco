import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/security/csrf';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: { csrf_token: generateCsrfToken() },
  });
}
