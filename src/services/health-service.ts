import fs from 'node:fs/promises';
import path from 'node:path';

export function getSystemHealthStatus() {
  const madridNow = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());

  return {
    appName: process.env.APP_NAME || 'Artículos de Tiro con Arco',
    runtime: `Node.js ${process.version} (Next.js Serverless)`,
    timezone: 'Europe/Madrid',
    timestamp: madridNow,
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  };
}

export async function getManualMarkdownContent(): Promise<string> {
  try {
    const manualPath = path.join(process.cwd(), 'docs', 'manual_usuario.md');
    return await fs.readFile(manualPath, 'utf8');
  } catch {
    return '# Manual de Usuario\n\nManual de usuario no disponible.';
  }
}
