import type { Metadata } from 'next';
import { WorkbookClient } from '@/components/workbook/WorkbookClient';

export const metadata: Metadata = {
  title: 'Cuaderno de Tiro — Plantillas, Diana Interactiva y Herramientas',
  description:
    'Suite técnica interactiva de campo: diana World Archery táctil, generador de fichas PDF, calculadora de spine, conversor de medidas y semáforo sonoro reglamentario.',
};

export default function WorkbookPage() {
  return <WorkbookClient />;
}
