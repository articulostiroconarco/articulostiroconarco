import { NextResponse } from 'next/server';
import { getSystemHealthStatus } from '@/services/health-service';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: getSystemHealthStatus(),
  });
}
