import { NextResponse } from 'next/server';
import { getManualMarkdownContent } from '@/services/health-service';

export async function GET() {
  const markdown = await getManualMarkdownContent();
  return NextResponse.json({
    success: true,
    data: { markdown },
  });
}
