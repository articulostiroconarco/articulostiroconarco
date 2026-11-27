export interface RawCategory {
  id: string;
  slug: string;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  icono: string;
  imagen_portada?: string;
  orden: number;
  created_at?: string;
}

export interface RawArticle {
  id: string;
  categoria_id: string;
  titulo: string;
  subtitulo: string;
  resumen: string;
  autor: string;
  fecha: string;
  drive_url: string | null;
  tipo_archivo: string | null;
  destacado: boolean;
  orden: number;
  nivel?: string;
  created_at?: string;
}

export interface ArticleEntity {
  slug: string;
  dbId: string;
  title: string;
  subtitle: string;
  categoryKey: string;
  categoryName: string;
  categoryRoman: string;
  number: string;
  excerpt: string;
  level: string;
  readTime: string;
  contentHtml: string;
  tags: string[];
  isFeatured: boolean;
  publishedAt: string;
  driveUrl: string | null;
  drivePreviewUrl: string | null;
  driveDownloadUrl: string | null;
  fileType: string | null;
  author: string;
}

export interface CategoryGroup {
  key: string;
  id: string;
  name: string;
  roman: string;
  description: string;
  icon: string;
  articles: ArticleEntity[];
}

export interface LeadRecord {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  motivo: string | null;
  mensaje: string;
  leido: boolean;
  respondido: boolean;
  created_at: string;
}

export interface WhatsAppConfig {
  rawPhone: string;
  cleanPhone: string;
  message: string;
  encodedMessage: string;
  tooltip: string;
  url: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
