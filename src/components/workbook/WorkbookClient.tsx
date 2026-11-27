'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { showToast } from '@/components/ui/ToastProvider';

interface Impact {
  tanda: number;
  flecha: number;
  x: number;
  y: number;
  score: number;
  label: string;
}

interface StoredSession {
  id: string;
  savedAt: string;
  date: string;
  archer: string;
  bow: string;
  dist: string;
  braceHeight: string;
  tiller: string;
  drawWeight: string;
  arrows: string;
  buttonPlunger: string;
  sightSettings: string;
  sessionNotes: string;
  tandas: string[][];
  impacts: Impact[];
  grandTotal: number;
  arrowsCount: number;
  avg: string;
}

const STORAGE_KEY = 'archery_sessions_history';

// Constantes físicas reglamentarias (Regla 3)
const LBS_TO_KG = 0.45359237;
const KG_TO_LBS = 2.20462262;
const IN_TO_CM = 2.54;
const CM_TO_IN = 0.393700787;
const GRAIN_TO_G = 0.06479891;
const G_TO_GRAIN = 15.4323584;

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createEmptyGrid(): string[][] {
  return Array.from({ length: 10 }, () => Array.from({ length: 6 }, () => ''));
}

function arrowNumericValue(val: string): { points: number; counted: boolean } {
  const clean = val.trim().toUpperCase();
  if (clean === 'X' || clean === '10') return { points: 10, counted: true };
  if (clean === 'M') return { points: 0, counted: true };
  if (clean === '' || clean === '-') return { points: 0, counted: false };
  const parsed = parseInt(clean, 10);
  if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 10) {
    return { points: parsed, counted: true };
  }
  return { points: 0, counted: false };
}

export function WorkbookClient() {
  const [activeTab, setActiveTab] = useState<'generator' | 'templates' | 'tools' | 'history'>('generator');
  const [activeTanda, setActiveTanda] = useState<number>(1);
  const [tandas, setTandas] = useState<string[][]>(createEmptyGrid);
  const [impacts, setImpacts] = useState<Impact[]>([]);

  // Datos de la ficha
  const [archerName, setArcherName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [bowType, setBowType] = useState('Recurvo Olímpico');
  const [targetDistance, setTargetDistance] = useState('18 m (Diana 40 cm)');
  const [braceHeight, setBraceHeight] = useState('');
  const [tiller, setTiller] = useState('');
  const [drawWeight, setDrawWeight] = useState('');
  const [arrows, setArrows] = useState('');
  const [buttonPlunger, setButtonPlunger] = useState('');
  const [sightSettings, setSightSettings] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // Calculadora de Spine
  const [spineBowType, setSpineBowType] = useState<'recurve' | 'compound' | 'traditional'>('recurve');
  const [spineDrawWeight, setSpineDrawWeight] = useState<number>(38);
  const [spineArrowLength, setSpineArrowLength] = useState<number>(28.5);
  const [spinePointWeight, setSpinePointWeight] = useState<number>(100);

  // Conversor de unidades
  const [convLbs, setConvLbs] = useState('40');
  const [convKg, setConvKg] = useState('18.14');
  const [convInches, setConvInches] = useState('28.5');
  const [convCm, setConvCm] = useState('72.39');
  const [convGrains, setConvGrains] = useState('100');
  const [convGrams, setConvGrams] = useState('6.48');

  // Semáforo y Cronómetro
  const [timerDuration, setTimerDuration] = useState<number>(120);
  const [timerRemaining, setTimerRemaining] = useState<number>(120);
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused' | 'emergency'>('idle');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const clearHistoryDialogRef = useRef<HTMLDialogElement | null>(null);

  // Historial en localStorage
  const [history, setHistory] = useState<StoredSession[]>([]);

  useEffect(() => {
    setSessionDate((prev) => prev || new Date().toISOString().slice(0, 10));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch {
      // Ignorar errores de almacenamiento privado
    }
  }, []);

  useEffect(() => {
    const dlg = clearHistoryDialogRef.current;
    if (!dlg) return;
    const preventEscape = (e: Event) => e.preventDefault();
    dlg.addEventListener('cancel', preventEscape);
    return () => dlg.removeEventListener('cancel', preventEscape);
  }, []);

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Cálculos reactivos de totales y promedios
  let cumulative = 0;
  let totalArrows = 0;
  const rowStats = tandas.map((row) => {
    let sub = 0;
    for (const cell of row) {
      const { points, counted } = arrowNumericValue(cell);
      sub += points;
      if (counted) totalArrows += 1;
    }
    cumulative += sub;
    return { sub, cum: cumulative };
  });
  const grandTotal = cumulative;
  const scoreAvg = totalArrows > 0 ? (grandTotal / totalArrows).toFixed(2) : '0.00';

  // Diana oficial World Archery (R = 95 sobre viewBox 200x200)
  const handleTargetClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * 200) / rect.width;
    const y = ((e.clientY - rect.top) * 200) / rect.height;
    const dx = x - 100;
    const dy = y - 100;
    const r = Math.sqrt(dx * dx + dy * dy);
    const R = 95;

    let scoreLabel = 'M';
    let scoreVal = 0;
    if (r <= 0.05 * R) {
      scoreLabel = 'X';
      scoreVal = 10;
    } else if (r <= 0.1 * R) {
      scoreLabel = '10';
      scoreVal = 10;
    } else if (r <= 0.2 * R) {
      scoreLabel = '9';
      scoreVal = 9;
    } else if (r <= 0.3 * R) {
      scoreLabel = '8';
      scoreVal = 8;
    } else if (r <= 0.4 * R) {
      scoreLabel = '7';
      scoreVal = 7;
    } else if (r <= 0.5 * R) {
      scoreLabel = '6';
      scoreVal = 6;
    } else if (r <= 0.6 * R) {
      scoreLabel = '5';
      scoreVal = 5;
    } else if (r <= 0.7 * R) {
      scoreLabel = '4';
      scoreVal = 4;
    } else if (r <= 0.8 * R) {
      scoreLabel = '3';
      scoreVal = 3;
    } else if (r <= 0.9 * R) {
      scoreLabel = '2';
      scoreVal = 2;
    } else if (r <= 1.0 * R) {
      scoreLabel = '1';
      scoreVal = 1;
    }

    const rowIdx = activeTanda - 1;
    const currentRow = tandas[rowIdx] || [];
    const emptyIdx = currentRow.findIndex((c) => c.trim() === '' || c.trim() === '-');

    if (emptyIdx === -1) {
      showToast(
        `La tanda #${activeTanda} ya tiene sus 6 flechas completadas. Pasa a la siguiente tanda.`,
        'error'
      );
      return;
    }

    const flechaNum = emptyIdx + 1;
    setTandas((prev) => {
      const next = prev.map((rItem) => [...rItem]);
      next[rowIdx][emptyIdx] = scoreLabel;
      return next;
    });

    setImpacts((prev) => [
      ...prev,
      {
        tanda: activeTanda,
        flecha: flechaNum,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        score: scoreVal,
        label: scoreLabel,
      },
    ]);

    if (flechaNum === 6 && activeTanda < 10) {
      const nextTanda = activeTanda + 1;
      setActiveTanda(nextTanda);
      showToast(`Tanda #${activeTanda} completada. Ahora anotando en tanda #${nextTanda}.`, 'success');
    }
  };

  const undoLastImpact = () => {
    if (impacts.length === 0) return;
    const last = impacts[impacts.length - 1];
    setImpacts((prev) => prev.slice(0, -1));
    setTandas((prev) => {
      const next = prev.map((rItem) => [...rItem]);
      if (next[last.tanda - 1]) {
        next[last.tanda - 1][last.flecha - 1] = '';
      }
      return next;
    });
    showToast('Último impacto deshecho.', 'success');
  };

  const clearTargetImpacts = () => {
    setImpacts([]);
    showToast('Marcas visuales de la diana borradas.', 'success');
  };

  const handleCellChange = (tandaIdx: number, flechaIdx: number, raw: string) => {
    let val = raw.toUpperCase().trim();
    if (val !== '' && val !== 'X' && val !== 'M') {
      const num = parseInt(val, 10);
      if (Number.isNaN(num) || num < 0 || num > 10) {
        val = '';
      } else {
        val = String(num);
      }
    }
    setTandas((prev) => {
      const next = prev.map((rItem) => [...rItem]);
      next[tandaIdx][flechaIdx] = val;
      return next;
    });
  };

  // Cálculo de Spine
  let effectiveWeight = spineDrawWeight || 38;
  if (spineBowType === 'compound') effectiveWeight *= 1.25;
  else if (spineBowType === 'traditional') effectiveWeight *= 0.9;
  effectiveWeight += ((spineArrowLength || 28.5) - 28.0) * 4.5;
  effectiveWeight += (((spinePointWeight || 100) - 100) / 25) * 3.0;
  const baseSpine = Math.round(Math.round(23500 / Math.max(15, effectiveWeight)) / 50) * 50;
  const spineRange = `${baseSpine - 50} – ${baseSpine + 50}`;
  const spineNote =
    `Para ${
      spineBowType === 'compound'
        ? 'arco de poleas'
        : spineBowType === 'traditional'
        ? 'tiro tradicional'
        : 'recurvo olímpico'
    } de ${spineDrawWeight} lbs a ${spineArrowLength}" con puntas de ${spinePointWeight} gr.` +
    (spineArrowLength > 29.5
      ? ' Al tener apertura larga, se requiere un tubo más rígido para evitar vuelo parabólico errático.'
      : spinePointWeight > 120
      ? ' La punta pesada ablanda la dinámica de la flecha en la salida.'
      : '');

  // Silbato Web Audio API
  const playWhistleTone = useCallback(
    (count: number, onDone?: () => void) => {
      if (!soundEnabled) {
        onDone?.();
        return;
      }
      try {
        const AudioContextCtor =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextCtor();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        let played = 0;
        const whistleDuration = 0.32;
        const pauseDuration = 0.16;

        const triggerBeep = () => {
          if (played >= count) {
            onDone?.();
            return;
          }
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(2850, now);
          osc.frequency.exponentialRampToValueAtTime(3000, now + whistleDuration);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.35, now + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + whistleDuration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + whistleDuration);
          played += 1;
          setTimeout(triggerBeep, (whistleDuration + pauseDuration) * 1000);
        };

        triggerBeep();
      } catch {
        onDone?.();
      }
    },
    [soundEnabled]
  );

  const runCountdown = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev > 1) {
          return prev - 1;
        }
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setTimerState('idle');
        showToast('¡Tiempo cumplido! Fin de la serie.', 'error');
        playWhistleTone(3);
        return 0;
      });
    }, 1000);
  }, [playWhistleTone]);

  const startTimer = () => {
    if (timerState === 'running') return;
    const startingFresh = timerRemaining === timerDuration || timerRemaining === 0;
    if (timerRemaining === 0) {
      setTimerRemaining(timerDuration);
    }
    if (startingFresh) {
      showToast('Llamada a la línea de tiro. Comenzando serie...', 'success');
      playWhistleTone(2, () => {
        setTimeout(() => {
          playWhistleTone(1);
          setTimerState('running');
          runCountdown();
        }, 1000);
      });
    } else {
      setTimerState('running');
      runCountdown();
    }
  };

  const pauseTimer = () => {
    if (timerState !== 'running') return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerState('paused');
    showToast('Cronómetro en pausa.', 'success');
  };

  const resetTimer = (newDuration = timerDuration) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerRemaining(newDuration);
    setTimerState('idle');
  };

  const emergencyStop = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerState('emergency');
    playWhistleTone(4);
    showToast('¡ALTO EL TIRO DE EMERGENCIA! Todos los arqueros bajan el arco.', 'error');
  };

  // Historial localStorage
  const persistHistory = (next: StoredSession[]) => {
    setHistory(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      showToast('No se pudo guardar en el almacenamiento local del navegador.', 'error');
    }
  };

  const saveToLocalHistory = () => {
    const entry: StoredSession = {
      id: `session_${Date.now()}`,
      savedAt: new Date().toISOString(),
      date: sessionDate || new Date().toISOString().slice(0, 10),
      archer: archerName.trim() || 'Arquero',
      bow: bowType,
      dist: targetDistance.trim() || '18 m',
      braceHeight: braceHeight.trim(),
      tiller: tiller.trim(),
      drawWeight: drawWeight.trim(),
      arrows: arrows.trim(),
      buttonPlunger: buttonPlunger.trim(),
      sightSettings: sightSettings.trim(),
      sessionNotes: sessionNotes.trim(),
      tandas: tandas.map((rItem) => [...rItem]),
      impacts: [...impacts],
      grandTotal,
      arrowsCount: totalArrows,
      avg: scoreAvg,
    };

    const updated = [entry, ...history].slice(0, 50);
    persistHistory(updated);
    showToast('Sesión guardada exitosamente en el historial local.', 'success');
  };

  const loadSession = (s: StoredSession) => {
    setArcherName(s.archer || '');
    setSessionDate(s.date || new Date().toISOString().slice(0, 10));
    setBowType(s.bow || 'Recurvo Olímpico');
    setTargetDistance(s.dist || '');
    setBraceHeight(s.braceHeight || '');
    setTiller(s.tiller || '');
    setDrawWeight(s.drawWeight || '');
    setArrows(s.arrows || '');
    setButtonPlunger(s.buttonPlunger || '');
    setSightSettings(s.sightSettings || '');
    setSessionNotes(s.sessionNotes || '');
    setTandas(
      Array.isArray(s.tandas) && s.tandas.length === 10
        ? s.tandas.map((rItem) => [...rItem])
        : createEmptyGrid()
    );
    setImpacts(Array.isArray(s.impacts) ? [...s.impacts] : []);
    setActiveTab('generator');
    showToast(`Sesión del ${s.date} cargada en el formulario.`, 'success');
  };

  const deleteSession = (id: string) => {
    persistHistory(history.filter((s) => s.id !== id));
    showToast('Sesión eliminada del historial.', 'success');
  };

  const confirmClearAllHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
    clearHistoryDialogRef.current?.close();
    showToast('Historial completo eliminado.', 'success');
  };

  // Descarga CSV con BOM UTF-8
  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 300);
  };

  const exportToCsv = () => {
    const archer = archerName.trim() || 'Arquero';
    const date = sessionDate || new Date().toISOString().slice(0, 10);
    let csv = '\uFEFF';
    csv += 'ARTÍCULOS DE TIRO CON ARCO - REGISTRO TÉCNICO DE SESIÓN\n\n';
    csv += `Arquero;${archer}\nFecha;${date}\nModalidad;${bowType}\nDistancia;${targetDistance}\n`;
    csv += `Fistmelo;${braceHeight}\nTiller;${tiller}\nPotencia;${drawWeight}\nFlechas;${arrows}\n\n`;
    csv += 'Tanda;F1;F2;F3;F4;F5;F6;Subtotal;Acumulado\n';

    tandas.forEach((row, idx) => {
      const cells = row.map((v) => v.trim().toUpperCase() || '-');
      csv += `Tanda #${idx + 1};${cells.join(';')};${rowStats[idx].sub};${rowStats[idx].cum}\n`;
    });
    csv += `\nTOTAL GENERAL;;;;;;;${grandTotal} pts (Promedio: ${scoreAvg})\n`;

    downloadCsv(csv, `sesion_tiro_${date}_${archer.replace(/\s+/g, '_')}.csv`);
    showToast('Archivo CSV de la sesión descargado correctamente.', 'success');
  };

  const exportHistoryToCsv = () => {
    if (history.length === 0) {
      showToast('No hay sesiones guardadas en el historial para exportar.', 'error');
      return;
    }
    let csv = '\uFEFFHISTORIAL DE ENTRENAMIENTOS - ARTÍCULOS DE TIRO CON ARCO\n\n';
    csv += 'Fecha;Arquero;Modalidad;Distancia;Flechas;Puntos;Promedio\n';
    history.forEach((s) => {
      csv += `${s.date};${s.archer};${s.bow};${s.dist};${s.arrowsCount || 0};${s.grandTotal || 0};${s.avg || '0.00'}\n`;
    });
    downloadCsv(csv, `historial_completo_tiro_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast('Historial completo exportado a CSV.', 'success');
  };

  // Generación e impresión PDF en cliente
  const printHtmlDocument = (htmlContent: string, title: string) => {
    showToast('Generando documento en cliente. Abriendo diálogo de impresión / PDF...', 'success');

    let iframe = document.getElementById('printWorkbookFrame') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'printWorkbookFrame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const targetDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!targetDoc) return;

    targetDoc.open();
    targetDoc.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm 15mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; background: #fff; font-size: 10.5pt; line-height: 1.35; }
    .sheet-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #002619; padding-bottom: 8px; margin-bottom: 12px; }
    .sheet-brand-title { font-size: 15pt; font-weight: 700; color: #002619; text-transform: uppercase; }
    .sheet-brand-subtitle { font-size: 8.5pt; color: #D98218; font-weight: 600; text-transform: uppercase; }
    .sheet-doc-badge { border: 1px solid #717974; padding: 3px 8px; border-radius: 3px; font-size: 8.5pt; font-weight: 600; }
    .section-box { margin-bottom: 10px; border: 1px solid #c0c9c2; border-radius: 4px; padding: 8px 10px; }
    .section-title { font-size: 9.5pt; font-weight: 700; color: #002619; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #e1e3e4; padding-bottom: 2px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; }
    .field-item { display: flex; flex-direction: column; }
    .field-label { font-size: 7.5pt; text-transform: uppercase; color: #555; font-weight: 600; margin-bottom: 2px; }
    .field-value { font-size: 9.5pt; font-weight: 600; color: #111; min-height: 15px; border-bottom: 1px dotted #ccc; }
    table.table-sheet { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 4px; }
    table.table-sheet th, table.table-sheet td { border: 1px solid #333; padding: 3px 5px; text-align: center; }
    table.table-sheet th { background: #f0f4f2; font-weight: 700; }
    .sheet-footer { margin-top: 10px; display: flex; justify-content: space-between; font-size: 7.5pt; color: #666; border-top: 1px solid #ccc; padding-top: 5px; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`);
    targetDoc.close();

    setTimeout(() => {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    }, 400);
  };

  const printTemplate = (type: 'tuning' | 'scorecard' | 'grouping') => {
    if (type === 'tuning') {
      printHtmlDocument(
        `<div class="sheet-header"><div><div class="sheet-brand-title">Artículos de Tiro con Arco</div><div class="sheet-brand-subtitle">Ficha Oficial de Puesta a Punto (Tuning & Setup)</div></div><div class="sheet-doc-badge">CONTROL TÉCNICO</div></div>
         <div class="section-box"><div class="section-title">1. Datos del Arquero y Modalidad</div><div class="grid-3"><div class="field-item"><span class="field-label">Arquero:</span><div class="field-value"></div></div><div class="field-item"><span class="field-label">Club / Galería:</span><div class="field-value"></div></div><div class="field-item"><span class="field-label">Fecha:</span><div class="field-value"></div></div></div><div class="grid-3" style="margin-top:6px;"><div class="field-item"><span class="field-label">Modalidad:</span><div class="field-value">[ ] Recurvo [ ] Compuesto [ ] Barebow [ ] Tradicional</div></div><div class="field-item"><span class="field-label">Apertura:</span><div class="field-value"></div></div><div class="field-item"><span class="field-label">Potencia en Dedos:</span><div class="field-value"></div></div></div></div>
         <div class="section-box"><div class="section-title">2. Geometría y Ajustes del Arco</div><div class="grid-3"><div class="field-item"><span class="field-label">Cuerpo / Longitud:</span><div class="field-value"></div></div><div class="field-item"><span class="field-label">Palas / Potencia:</span><div class="field-value"></div></div><div class="field-item"><span class="field-label">Fistmelo (Brace Height):</span><div class="field-value"></div></div></div><div class="grid-3" style="margin-top:6px;"><div class="field-item"><span class="field-label">Tiller Sup./Inf.:</span><div class="field-value"></div></div><div class="field-item"><span class="field-label">Cuerda (Hilos):</span><div class="field-value"></div></div><div class="field-item"><span class="field-label">Punto de Encoque:</span><div class="field-value"></div></div></div></div>
         <div class="section-box"><div class="section-title">3. Botón de Presión, Visor y Flechas</div><div class="grid-4"><div class="field-item"><span class="field-label">Botón Berger:</span><div class="field-value"></div></div><div class="field-item"><span class="field-label">Marca y Spine:</span><div class="field-value"></div></div><div class="field-item"><span class="field-label">Longitud Tubo:</span><div class="field-value"></div></div><div class="field-item"><span class="field-label">Punta (Grains):</span><div class="field-value"></div></div></div></div>
         <div class="section-box"><div class="section-title">4. Prueba de Flecha Desnuda (Bare Shaft Tuning)</div><div style="min-height:90px;font-size:8.5pt;color:#666;">Anotar impactos de flechas desnudas respecto al grupo emplumado a 18 m o 30 m:</div></div>
         <div class="sheet-footer"><span>Artículos de Tiro con Arco · Damiá Juan Ramis</span><span>Archivo Técnico</span></div>`,
        'Ficha de Puesta a Punto y Tuning'
      );
    } else if (type === 'scorecard') {
      const rows1 = Array.from(
        { length: 10 },
        (_, i) =>
          `<tr><td style="font-weight:700;background:#f9f9f9;">#${i + 1}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`
      ).join('');
      const rows2 = Array.from(
        { length: 10 },
        (_, i) =>
          `<tr><td style="font-weight:700;background:#f9f9f9;">#${i + 11}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`
      ).join('');
      printHtmlDocument(
        `<div class="sheet-header"><div><div class="sheet-brand-title">Artículos de Tiro con Arco</div><div class="sheet-brand-subtitle">Hoja Oficial de Puntuaciones y Series</div></div><div class="sheet-doc-badge">ENTRENAMIENTO / MATCH</div></div>
         <div class="section-box"><div class="grid-4"><div class="field-item"><span class="field-label">Arquero:</span><div class="field-value"></div></div><div class="field-item"><span class="field-label">Modalidad:</span><div class="field-value"></div></div><div class="field-item"><span class="field-label">Distancia:</span><div class="field-value"></div></div><div class="field-item"><span class="field-label">Fecha:</span><div class="field-value"></div></div></div></div>
         <table class="table-sheet"><thead><tr><th>Tanda</th><th>F1</th><th>F2</th><th>F3</th><th>F4</th><th>F5</th><th>F6</th><th>Parcial</th><th>Total</th><th>10</th><th>X</th></tr></thead><tbody>${rows1}<tr style="background:#e6eee9;font-weight:700;"><td colspan="7" style="text-align:right;padding-right:10px;">SUBTOTAL 1ª VUELTA:</td><td></td><td></td><td></td><td></td></tr>${rows2}<tr style="background:#002619;color:#fff;font-weight:700;"><td colspan="7" style="text-align:right;padding-right:10px;color:#fff;">TOTAL GENERAL:</td><td></td><td></td><td></td><td></td></tr></tbody></table>
         <div class="grid-2" style="margin-top:14px;"><div class="field-item"><span class="field-label">Firma del Arquero:</span><div style="height:28px;border-bottom:1px solid #333;"></div></div><div class="field-item"><span class="field-label">Firma del Monitor / Testigo:</span><div style="height:28px;border-bottom:1px solid #333;"></div></div></div>`,
        'Hoja de Puntuaciones y Series'
      );
    } else {
      const targetCard = (label: string) =>
        `<div style="border:1px solid #bbb;border-radius:4px;padding:6px;text-align:center;"><div style="font-weight:700;font-size:8.5pt;margin-bottom:3px;text-transform:uppercase;color:#002619;">${label}</div><svg viewBox="0 0 100 100" style="width:165px;height:165px;display:block;margin:0 auto;"><circle cx="50" cy="50" r="48" fill="#fff" stroke="#222" stroke-width="0.8"/><circle cx="50" cy="50" r="43.2" fill="#fff" stroke="#222" stroke-width="0.6"/><circle cx="50" cy="50" r="38.4" fill="#333" stroke="#fff" stroke-width="0.5"/><circle cx="50" cy="50" r="33.6" fill="#333" stroke="#fff" stroke-width="0.5"/><circle cx="50" cy="50" r="28.8" fill="#555" stroke="#fff" stroke-width="0.5"/><circle cx="50" cy="50" r="24" fill="#555" stroke="#fff" stroke-width="0.5"/><circle cx="50" cy="50" r="19.2" fill="#888" stroke="#fff" stroke-width="0.5"/><circle cx="50" cy="50" r="14.4" fill="#888" stroke="#fff" stroke-width="0.5"/><circle cx="50" cy="50" r="9.6" fill="#D98218" stroke="#222" stroke-width="0.6"/><circle cx="50" cy="50" r="4.8" fill="#D98218" stroke="#222" stroke-width="0.6"/><line x1="48" y1="50" x2="52" y2="50" stroke="#000" stroke-width="0.8"/><line x1="50" y1="48" x2="50" y2="52" stroke="#000" stroke-width="0.8"/></svg><div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;font-size:7.5pt;margin-top:4px;text-align:left;"><div>Dist: _____</div><div>Viento: _____</div><div>Serie: _____</div><div>Visor: _____</div></div></div>`;

      printHtmlDocument(
        `<div class="sheet-header"><div><div class="sheet-brand-title">Artículos de Tiro con Arco</div><div class="sheet-brand-subtitle">Dianas de Agrupación y Dispersión (Grouping)</div></div><div class="sheet-doc-badge">DIAGNÓSTICO BIOMECÁNICO</div></div>
         <div class="grid-2" style="gap:10px;">${targetCard('Diana 1 — Serie A')}${targetCard('Diana 2 — Serie B')}${targetCard('Diana 3 — Serie C')}${targetCard('Diana 4 — Serie D')}</div>
         <div class="section-box" style="margin-top:10px;"><div class="section-title">Diagnóstico de la Dispersión</div><div style="font-size:8pt;color:#444;line-height:1.4;">• <strong>Dispersión horizontal:</strong> Error de alineación corporal, torsión en el agarre (grip) o viento.<br>• <strong>Dispersión vertical:</strong> Variación de anclaje, presión dispar en dedos o caída del brazo de arco.</div></div>`,
        'Dianas de Agrupación (Grouping)'
      );
    }
  };

  const generateCustomPdf = () => {
    const archer = archerName.trim() || 'Arquero / Tirador';
    let targetSvgHtml = '';
    if (svgRef.current && impacts.length > 0) {
      const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('style', 'width: 140px; height: 140px; display: block; margin: 0 auto;');
      targetSvgHtml = `<div style="border:1px solid #ccc;border-radius:4px;padding:6px;text-align:center;width:155px;"><div style="font-size:8pt;font-weight:700;text-transform:uppercase;color:#002619;margin-bottom:4px;">Agrupación en Diana</div>${clone.outerHTML}<div style="font-size:7.5pt;color:#666;margin-top:3px;">${impacts.length} impactos</div></div>`;
    }

    const scoreRows = tandas
      .map((row, idx) => {
        const cells = row.map((c) => escapeHtml(c.trim().toUpperCase() || '-'));
        return `<tr><td style="font-weight:700;background:#f9f9f9;">#${idx + 1}</td><td>${cells[0]}</td><td>${cells[1]}</td><td>${cells[2]}</td><td>${cells[3]}</td><td>${cells[4]}</td><td>${cells[5]}</td><td style="font-weight:600;">${rowStats[idx].sub}</td><td style="font-weight:700;color:#002619;">${rowStats[idx].cum}</td></tr>`;
      })
      .join('');

    printHtmlDocument(
      `<div class="sheet-header"><div><div class="sheet-brand-title">Artículos de Tiro con Arco</div><div class="sheet-brand-subtitle">Informe Técnico de Sesión y Puesta a Punto</div></div><div class="sheet-doc-badge">INFORME PERSONALIZADO</div></div>
       <div class="section-box"><div class="section-title">A. Datos del Arquero y Sesión</div><div class="grid-4"><div class="field-item"><span class="field-label">Arquero:</span><div class="field-value">${escapeHtml(archer)}</div></div><div class="field-item"><span class="field-label">Fecha:</span><div class="field-value">${escapeHtml(sessionDate)}</div></div><div class="field-item"><span class="field-label">Modalidad:</span><div class="field-value">${escapeHtml(bowType)}</div></div><div class="field-item"><span class="field-label">Distancia:</span><div class="field-value">${escapeHtml(targetDistance)}</div></div></div></div>
       <div class="section-box"><div class="section-title">B. Puesta a Punto (Tuning)</div><div class="grid-3"><div class="field-item"><span class="field-label">Fistmelo:</span><div class="field-value">${escapeHtml(braceHeight || '—')}</div></div><div class="field-item"><span class="field-label">Tiller:</span><div class="field-value">${escapeHtml(tiller || '—')}</div></div><div class="field-item"><span class="field-label">Potencia:</span><div class="field-value">${escapeHtml(drawWeight || '—')}</div></div></div><div class="grid-3" style="margin-top:6px;"><div class="field-item"><span class="field-label">Flechas / Spine:</span><div class="field-value">${escapeHtml(arrows || '—')}</div></div><div class="field-item"><span class="field-label">Botón de Presión:</span><div class="field-value">${escapeHtml(buttonPlunger || '—')}</div></div><div class="field-item"><span class="field-label">Visor / Clicker:</span><div class="field-value">${escapeHtml(sightSettings || '—')}</div></div></div></div>
       <div class="section-box"><div class="section-title">C. Puntuaciones y Estadísticas</div><div style="display:flex;gap:12px;align-items:flex-start;"><div style="flex:1;"><table class="table-sheet"><thead><tr><th>Tanda</th><th>F1</th><th>F2</th><th>F3</th><th>F4</th><th>F5</th><th>F6</th><th>Parcial</th><th>Total</th></tr></thead><tbody>${scoreRows}<tr style="background:#002619;color:#fff;font-weight:700;"><td colspan="7" style="text-align:right;padding-right:10px;color:#fff;">TOTAL SESIÓN:</td><td colspan="2" style="color:#fff;">${grandTotal} pts</td></tr></tbody></table><div style="margin-top:6px;font-size:8pt;display:flex;gap:14px;background:#f9f9f9;padding:4px 8px;border:1px solid #ddd;"><span><strong>Flechas tiradas:</strong> ${totalArrows}</span><span><strong>Promedio / flecha:</strong> ${scoreAvg}</span></div></div>${targetSvgHtml}</div></div>
       <div class="section-box"><div class="section-title">D. Observaciones Biomecánicas</div><div style="font-size:8.5pt;color:#222;min-height:30px;">${escapeHtml(sessionNotes || 'Sin observaciones.')}</div></div>
       <div class="sheet-footer"><span>Artículos de Tiro con Arco · Generador en Cliente</span><span>Emitido el ${new Date().toLocaleDateString('es-ES')}</span></div>`,
      `Ficha Técnica - ${archer} - ${sessionDate}`
    );
  };

  const formattedClock = `${String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:${String(
    timerRemaining % 60
  ).padStart(2, '0')}`;

  return (
    <main className="flex-1 pt-24 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex flex-col gap-10">
        {/* Cabecera */}
        <header className="flex flex-col gap-4 border-b border-light-outline-variant/60 pb-8">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-gold-accent rounded-full" />
            <span className="font-mono text-mono-sm uppercase tracking-widest text-light-primary font-semibold">
              Suite Técnica · Ofimática en Cliente
            </span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="font-headline text-display-md-mobile md:text-display-md text-light-primary">
                Cuaderno de Tiro y Herramientas de Campo
              </h1>
              <p className="font-body text-body-lg text-light-on-surface-variant max-w-2xl mt-2">
                Suite integral para arqueros: anota impactos en la diana táctil, genera fichas en PDF,
                calcula el <em>spine</em> de tus flechas, entrena con el semáforo sonoro y guarda tus
                sesiones en tu dispositivo.
              </p>
            </div>

            <div className="flex flex-wrap p-1 bg-light-surface-container rounded-sm border border-light-outline-variant self-start lg:self-auto gap-1">
              {[
                { key: 'generator', icon: 'adjust', label: 'Ficha y Diana' },
                { key: 'templates', icon: 'print', label: 'Plantillas PDF' },
                { key: 'tools', icon: 'construction', label: 'Herramientas Galería' },
                { key: 'history', icon: 'history', label: 'Mi Historial', badge: history.length },
              ].map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`px-4 py-2 rounded-xs font-label text-label-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? 'bg-light-surface-container-lowest text-light-primary shadow-sm font-semibold'
                        : 'text-light-on-surface-variant hover:text-light-primary'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-sm ${active ? 'text-gold-accent' : ''}`}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className="bg-light-primary text-light-on-primary text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* PESTAÑA 1: FICHA Y DIANA */}
        {activeTab === 'generator' && (
          <section className="flex flex-col gap-8">
            <div>
              <h2 className="font-headline text-headline-sm text-light-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-gold-accent">edit_note</span>
                <span>1. Ficha Técnica y Diana Interactiva (Plotter de Impactos)</span>
              </h2>
              <p className="font-body text-body-md text-light-on-surface-variant mt-1">
                Toca o haz clic sobre la diana para registrar tus impactos de cada flecha. El sistema
                calcula la puntuación reglamentaria World Archery y actualiza tus estadísticas al instante.
              </p>
            </div>

            <div className="flex flex-col gap-8">
              {/* Bloque A */}
              <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-sm p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
                <h3 className="font-headline text-title-lg text-light-primary flex items-center gap-2 border-b border-light-outline-variant/60 pb-3">
                  <span className="material-symbols-outlined text-gold-accent">person</span>
                  <span>A · Datos del Arquero y de la Sesión</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">
                      Nombre del Arquero
                    </label>
                    <input
                      type="text"
                      value={archerName}
                      onChange={(e) => setArcherName(e.target.value)}
                      placeholder="Ej. Damián Aragó"
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary focus:ring-light-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">Fecha</label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary focus:ring-light-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">
                      Modalidad de Arco
                    </label>
                    <select
                      value={bowType}
                      onChange={(e) => setBowType(e.target.value)}
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary focus:ring-light-primary"
                    >
                      <option value="Recurvo Olímpico">Recurvo Olímpico</option>
                      <option value="Arco Compuesto (Poleas)">Arco Compuesto (Poleas)</option>
                      <option value="Barebow (Arco Desnudo)">Barebow (Arco Desnudo)</option>
                      <option value="Tradicional / Longbow">Tradicional / Longbow</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">
                      Distancia y Diana
                    </label>
                    <input
                      type="text"
                      value={targetDistance}
                      onChange={(e) => setTargetDistance(e.target.value)}
                      placeholder="Ej. 18 m (Diana 40 cm)"
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary focus:ring-light-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque B: Diana + Tabla */}
              <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-sm p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-outline-variant/60 pb-3">
                  <h3 className="font-headline text-title-lg text-light-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-accent">adjust</span>
                    <span>B · Diana Táctil de Impactos y Tabla de Tandas</span>
                  </h3>

                  <div className="flex items-center gap-4 bg-light-surface-container px-4 py-1.5 rounded-sm border border-light-outline-variant">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs uppercase text-light-on-surface-variant">Total:</span>
                      <span className="font-mono text-title-lg font-bold text-light-primary">
                        {grandTotal}
                      </span>
                    </div>
                    <div className="w-px h-5 bg-light-outline-variant" />
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs uppercase text-light-on-surface-variant">
                        Promedio:
                      </span>
                      <span className="font-mono text-title-md font-semibold text-gold-accent">
                        {scoreAvg}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Diana SVG */}
                  <div className="lg:col-span-5 flex flex-col items-center gap-4 bg-light-surface-container-low p-5 rounded-sm border border-light-outline-variant">
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-label text-label-md text-light-on-surface font-semibold">
                          Tanda activa:
                        </span>
                        <select
                          value={activeTanda}
                          onChange={(e) => setActiveTanda(Number(e.target.value) || 1)}
                          className="rounded-sm border-light-outline-variant text-xs font-mono font-bold py-1 px-2 focus:border-light-primary"
                        >
                          {Array.from({ length: 10 }, (_, idx) => (
                            <option key={idx + 1} value={idx + 1}>
                              Tanda #{idx + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={undoLastImpact}
                          className="p-1 rounded-sm border border-light-outline-variant hover:bg-light-surface-container text-xs flex items-center gap-1 text-light-on-surface cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">undo</span>
                          <span>Deshacer</span>
                        </button>
                        <button
                          type="button"
                          onClick={clearTargetImpacts}
                          className="p-1 rounded-sm border border-light-outline-variant hover:bg-light-surface-container text-xs flex items-center gap-1 text-light-error cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          <span>Limpiar</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center select-none cursor-crosshair">
                      <svg
                        ref={svgRef}
                        onClick={handleTargetClick}
                        viewBox="0 0 200 200"
                        className="w-full h-full drop-shadow-md rounded-full bg-white"
                      >
                        <circle cx="100" cy="100" r="95" fill="#FFFFFF" stroke="#333" strokeWidth="0.8" />
                        <circle cx="100" cy="100" r="85.5" fill="#FFFFFF" stroke="#666" strokeWidth="0.6" />
                        <circle cx="100" cy="100" r="76" fill="#1C1E1D" stroke="#fff" strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="66.5" fill="#1C1E1D" stroke="#fff" strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="57" fill="#008FD5" stroke="#fff" strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="47.5" fill="#008FD5" stroke="#fff" strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="38" fill="#E4251B" stroke="#fff" strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="28.5" fill="#E4251B" stroke="#fff" strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="19" fill="#FFDA00" stroke="#333" strokeWidth="0.6" />
                        <circle cx="100" cy="100" r="9.5" fill="#FFDA00" stroke="#333" strokeWidth="0.6" />
                        <circle
                          cx="100"
                          cy="100"
                          r="4.75"
                          fill="none"
                          stroke="#333"
                          strokeWidth="0.4"
                          strokeDasharray="1.5 1"
                        />
                        <line x1="97" y1="100" x2="103" y2="100" stroke="#333" strokeWidth="0.8" />
                        <line x1="100" y1="97" x2="100" y2="103" stroke="#333" strokeWidth="0.8" />
                        <g>
                          {impacts.map((imp, i) => (
                            <g key={`${imp.tanda}-${imp.flecha}-${i}`}>
                              <circle
                                cx={imp.x}
                                cy={imp.y}
                                r="3.5"
                                fill="#FFFFFF"
                                stroke="#002619"
                                strokeWidth="1.2"
                              />
                              <text
                                x={imp.x}
                                y={imp.y + 1.2}
                                fontSize="3.5"
                                fontFamily="sans-serif"
                                fontWeight="bold"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#002619"
                              >
                                {imp.flecha}
                              </text>
                            </g>
                          ))}
                        </g>
                      </svg>
                    </div>

                    <div className="text-center font-mono text-[11px] text-light-on-surface-variant">
                      Toca en la diana para marcar cada flecha. El impacto se asigna a la tanda activa.
                    </div>
                  </div>

                  {/* Tabla de tandas */}
                  <div className="lg:col-span-7 flex flex-col gap-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-light-surface-container text-light-on-surface border-b border-light-outline-variant font-headline uppercase text-xs">
                            <th className="p-2 text-center w-12">Tanda</th>
                            <th className="p-2 text-center">F1</th>
                            <th className="p-2 text-center">F2</th>
                            <th className="p-2 text-center">F3</th>
                            <th className="p-2 text-center">F4</th>
                            <th className="p-2 text-center">F5</th>
                            <th className="p-2 text-center">F6</th>
                            <th className="p-2 text-center w-20">Parcial</th>
                            <th className="p-2 text-center w-20">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-light-outline-variant/60">
                          {tandas.map((row, tIdx) => {
                            const tandaNum = tIdx + 1;
                            const isCurrent = activeTanda === tandaNum;
                            return (
                              <tr
                                key={tandaNum}
                                className={`transition-colors ${
                                  isCurrent ? 'bg-gold-tint/40' : 'hover:bg-light-surface-container-low'
                                }`}
                              >
                                <td className="p-1.5 text-center font-mono font-bold text-light-primary bg-light-surface-container/50">
                                  #{tandaNum}
                                </td>
                                {row.map((cell, fIdx) => (
                                  <td key={fIdx} className="p-1 text-center">
                                    <input
                                      type="text"
                                      maxLength={2}
                                      value={cell}
                                      onFocus={() => setActiveTanda(tandaNum)}
                                      onChange={(e) => handleCellChange(tIdx, fIdx, e.target.value)}
                                      placeholder="-"
                                      className="w-10 h-8 text-center font-mono font-bold text-xs rounded-xs border-light-outline-variant focus:border-light-primary focus:ring-light-primary uppercase"
                                    />
                                  </td>
                                ))}
                                <td className="p-1.5 text-center font-mono font-semibold text-light-on-surface">
                                  {rowStats[tIdx].sub}
                                </td>
                                <td className="p-1.5 text-center font-mono font-bold text-light-primary">
                                  {rowStats[tIdx].cum}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque C: Tuning */}
              <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-sm p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
                <h3 className="font-headline text-title-lg text-light-primary flex items-center gap-2 border-b border-light-outline-variant/60 pb-3">
                  <span className="material-symbols-outlined text-gold-accent">handyman</span>
                  <span>C · Puesta a Punto (Tuning) y Sensaciones Técnicas</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">
                      Fistmelo (Brace Height)
                    </label>
                    <input
                      type="text"
                      value={braceHeight}
                      onChange={(e) => setBraceHeight(e.target.value)}
                      placeholder="Ej. 22.5 cm (8.85 in)"
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary focus:ring-light-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">
                      Tiller (Diferencia Sup./Inf.)
                    </label>
                    <input
                      type="text"
                      value={tiller}
                      onChange={(e) => setTiller(e.target.value)}
                      placeholder="Ej. +3 mm pala superior"
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary focus:ring-light-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">
                      Potencia en Dedos
                    </label>
                    <input
                      type="text"
                      value={drawWeight}
                      onChange={(e) => setDrawWeight(e.target.value)}
                      placeholder="Ej. 38.5 lbs @ 28.5 in"
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary focus:ring-light-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">
                      Flechas (Spine y Punta)
                    </label>
                    <input
                      type="text"
                      value={arrows}
                      onChange={(e) => setArrows(e.target.value)}
                      placeholder="Ej. Easton X10 600 · 110 gr"
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary focus:ring-light-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">
                      Botón de Presión / Salida
                    </label>
                    <input
                      type="text"
                      value={buttonPlunger}
                      onChange={(e) => setButtonPlunger(e.target.value)}
                      placeholder="Ej. Beiter 5.5 vueltas (muelle medio)"
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary focus:ring-light-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">
                      Marcas de Visor / Clicker
                    </label>
                    <input
                      type="text"
                      value={sightSettings}
                      onChange={(e) => setSightSettings(e.target.value)}
                      placeholder="Ej. Alza 4.8 · Deriva 1.2"
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary focus:ring-light-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-label text-label-md text-light-on-surface mb-1">
                    Observaciones biomecánicas (Alineación escapular, relajación de dedos, viento o fatiga)
                  </label>
                  <textarea
                    rows={2}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Sensaciones en la línea de tiro, regularidad en el paso del clicker o recomendaciones..."
                    className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary focus:ring-light-primary"
                  />
                </div>
              </div>

              {/* Botonera inferior */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-light-primary text-light-on-primary p-6 rounded-sm shadow-md">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-gold-accent">verified</span>
                  <div>
                    <h4 className="font-headline text-title-md text-white">
                      Sesión lista para exportar o guardar
                    </h4>
                    <p className="font-body text-body-sm text-white/70">
                      Todo se procesa en tu navegador con total privacidad y sin enviar datos al servidor.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={saveToLocalHistory}
                    className="px-4 py-2.5 rounded-sm border border-white/20 text-white font-label text-label-md hover:bg-white/10 transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-title-sm">bookmark</span>
                    <span>Guardar en Historial</span>
                  </button>
                  <button
                    type="button"
                    onClick={exportToCsv}
                    className="px-4 py-2.5 rounded-sm border border-gold-accent/40 text-gold-tint font-label text-label-md hover:bg-gold-accent/20 transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-title-sm">table_view</span>
                    <span>Exportar CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={generateCustomPdf}
                    className="px-5 py-2.5 rounded-sm bg-gold-accent text-light-on-primary font-label text-label-md font-semibold hover:bg-gold-accent/90 transition-colors shadow-md flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-title-sm">download</span>
                    <span>Descargar PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PESTAÑA 2: PLANTILLAS */}
        {activeTab === 'templates' && (
          <section className="flex flex-col gap-8">
            <div>
              <h2 className="font-headline text-headline-sm text-light-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-gold-accent">print</span>
                <span>2. Plantillas Oficiales para Imprimir o Descargar en PDF</span>
              </h2>
              <p className="font-body text-body-md text-light-on-surface-variant mt-1">
                Formatos vectoriales de alta precisión en hoja DIN A4 listos para llevar a la galería.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  type: 'tuning' as const,
                  icon: 'tune',
                  tag: 'Ajuste de Material',
                  title: 'Ficha de Puesta a Punto (Tuning)',
                  desc: 'Hoja técnica para registrar fistmelo, tiller, potencia, botón de presión, visor y parámetros de flechas.',
                  foot: 'Formato A4 vertical · Borde limpio',
                },
                {
                  type: 'scorecard' as const,
                  icon: 'scoreboard',
                  tag: 'Competición y Series',
                  title: 'Hoja de Puntuaciones y Series',
                  desc: 'Tabla organizada para tandas de sala (3 flechas) y aire libre (6 flechas), con casillas de parciales, totales, dieces y Xs.',
                  foot: '20 tandas · Doble vuelta',
                },
                {
                  type: 'grouping' as const,
                  icon: 'radar',
                  tag: 'Diagnóstico Biomecánico',
                  title: 'Dianas de Agrupación (Grouping)',
                  desc: 'Cuadrantes con dianas circulares para dibujar a mano el patrón de impactos y detectar desviaciones de suelta o viento.',
                  foot: '4 dianas vectoriales en página A4',
                },
              ].map((tpl) => (
                <article
                  key={tpl.type}
                  className="flex flex-col justify-between bg-light-surface-container-lowest border border-light-outline-variant/80 rounded-sm p-6 hover:border-light-primary transition-colors shadow-sm"
                >
                  <div className="flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-sm bg-light-primary text-light-on-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">{tpl.icon}</span>
                    </div>
                    <div>
                      <span className="font-mono text-mono-sm uppercase text-gold-accent font-semibold tracking-wider">
                        {tpl.tag}
                      </span>
                      <h3 className="font-headline text-title-lg text-light-on-surface mt-1">{tpl.title}</h3>
                      <p className="font-body text-body-sm text-light-on-surface-variant mt-2">{tpl.desc}</p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-light-outline-variant/40 mt-6 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => printTemplate(tpl.type)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-light-primary text-light-on-primary font-label text-label-md hover:bg-light-primary-container transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-title-sm">picture_as_pdf</span>
                      <span>Descargar / Imprimir PDF</span>
                    </button>
                    <span className="text-center font-mono text-xs text-light-on-surface-variant/70">
                      {tpl.foot}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* PESTAÑA 3: HERRAMIENTAS DE GALERÍA */}
        {activeTab === 'tools' && (
          <section className="flex flex-col gap-8">
            <div>
              <h2 className="font-headline text-headline-sm text-light-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-gold-accent">construction</span>
                <span>3. Herramientas de Galería y Pista</span>
              </h2>
              <p className="font-body text-body-md text-light-on-surface-variant mt-1">
                Calculadoras y utilidades técnicas para ajustar tu material y entrenar en galería.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Calculadora Spine */}
              <div className="lg:col-span-6 bg-light-surface-container-lowest border border-light-outline-variant rounded-sm p-6 sm:p-8 flex flex-col gap-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-light-outline-variant/60 pb-3">
                  <span className="material-symbols-outlined text-gold-accent">straighten</span>
                  <h3 className="font-headline text-title-lg text-light-primary">
                    Calculadora de Calibre (Spine de Flecha)
                  </h3>
                </div>
                <p className="font-body text-body-sm text-light-on-surface-variant">
                  Determina la rigidez estática adecuada según la paradoja del arquero:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">
                      Tipo de Arco
                    </label>
                    <select
                      value={spineBowType}
                      onChange={(e) =>
                        setSpineBowType(e.target.value as 'recurve' | 'compound' | 'traditional')
                      }
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary"
                    >
                      <option value="recurve">Recurvo Olímpico / Barebow</option>
                      <option value="compound">Compuesto (Poleas)</option>
                      <option value="traditional">Tradicional / Longbow</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">
                      Potencia Real (lbs)
                    </label>
                    <input
                      type="number"
                      min={15}
                      max={80}
                      value={spineDrawWeight}
                      onChange={(e) => setSpineDrawWeight(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">
                      Longitud de Tubo (pulgadas)
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min={22}
                      max={34}
                      value={spineArrowLength}
                      onChange={(e) => setSpineArrowLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-label-md text-light-on-surface mb-1">
                      Peso de Punta (grains)
                    </label>
                    <input
                      type="number"
                      min={60}
                      max={250}
                      value={spinePointWeight}
                      onChange={(e) => setSpinePointWeight(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-sm border-light-outline-variant text-body-sm focus:border-light-primary"
                    />
                  </div>
                </div>

                <div className="bg-light-primary text-light-on-primary p-4 rounded-sm flex items-center justify-between gap-4 mt-2">
                  <div>
                    <div className="font-mono text-xs uppercase text-gold-accent font-semibold tracking-wider">
                      Spine Estático Recomendado
                    </div>
                    <div className="font-headline text-headline-md text-white mt-0.5">{spineRange}</div>
                    <div className="font-body text-body-sm text-white/70 mt-1">{spineNote}</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-light-primary-container flex items-center justify-center text-gold-accent shrink-0">
                    <span className="material-symbols-outlined text-2xl">track_changes</span>
                  </div>
                </div>
              </div>

              {/* Conversor físico exacto */}
              <div className="lg:col-span-6 bg-light-surface-container-lowest border border-light-outline-variant rounded-sm p-6 sm:p-8 flex flex-col gap-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-light-outline-variant/60 pb-3">
                  <span className="material-symbols-outlined text-gold-accent">sync_alt</span>
                  <h3 className="font-headline text-title-lg text-light-primary">
                    Conversor de Medidas de Arquero
                  </h3>
                </div>
                <p className="font-body text-body-sm text-light-on-surface-variant">
                  Conversión instantánea con constantes físicas normalizadas:
                </p>

                <div className="flex flex-col gap-4">
                  <div className="p-3 bg-light-surface-container rounded-sm border border-light-outline-variant">
                    <span className="block font-mono text-xs text-light-primary font-bold uppercase mb-2">
                      Potencia: Libras (lbs) ↔ Kilogramos (kg)
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          value={convLbs}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConvLbs(val);
                            const num = parseFloat(val) || 0;
                            setConvKg((num * LBS_TO_KG).toFixed(2));
                          }}
                          className="w-full rounded-xs border-light-outline-variant text-body-sm py-1.5"
                        />
                        <span className="font-mono text-xs text-light-on-surface-variant">lbs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          value={convKg}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConvKg(val);
                            const num = parseFloat(val) || 0;
                            setConvLbs((num * KG_TO_LBS).toFixed(2));
                          }}
                          className="w-full rounded-xs border-light-outline-variant text-body-sm py-1.5"
                        />
                        <span className="font-mono text-xs text-light-on-surface-variant">kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-light-surface-container rounded-sm border border-light-outline-variant">
                    <span className="block font-mono text-xs text-light-primary font-bold uppercase mb-2">
                      Longitud: Pulgadas (in) ↔ Centímetros (cm)
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.25"
                          value={convInches}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConvInches(val);
                            const num = parseFloat(val) || 0;
                            setConvCm((num * IN_TO_CM).toFixed(2));
                          }}
                          className="w-full rounded-xs border-light-outline-variant text-body-sm py-1.5"
                        />
                        <span className="font-mono text-xs text-light-on-surface-variant">in</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          value={convCm}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConvCm(val);
                            const num = parseFloat(val) || 0;
                            setConvInches((num * CM_TO_IN).toFixed(2));
                          }}
                          className="w-full rounded-xs border-light-outline-variant text-body-sm py-1.5"
                        />
                        <span className="font-mono text-xs text-light-on-surface-variant">cm</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-light-surface-container rounded-sm border border-light-outline-variant">
                    <span className="block font-mono text-xs text-light-primary font-bold uppercase mb-2">
                      Masa: Granos (grains) ↔ Gramos (g)
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="5"
                          value={convGrains}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConvGrains(val);
                            const num = parseFloat(val) || 0;
                            setConvGrams((num * GRAIN_TO_G).toFixed(2));
                          }}
                          className="w-full rounded-xs border-light-outline-variant text-body-sm py-1.5"
                        />
                        <span className="font-mono text-xs text-light-on-surface-variant">gr</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          value={convGrams}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConvGrams(val);
                            const num = parseFloat(val) || 0;
                            setConvGrains(String(Math.round(num * G_TO_GRAIN)));
                          }}
                          className="w-full rounded-xs border-light-outline-variant text-body-sm py-1.5"
                        />
                        <span className="font-mono text-xs text-light-on-surface-variant">g</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Semáforo de Tiro */}
              <div className="lg:col-span-12 bg-light-surface-container-lowest border border-light-outline-variant rounded-sm p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-outline-variant/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-accent">timer</span>
                    <h3 className="font-headline text-title-lg text-light-primary">
                      Semáforo y Cronómetro de Tiro con Silbatos Oficiales
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-label text-label-md text-light-on-surface-variant">Duración:</span>
                    <select
                      value={timerDuration}
                      onChange={(e) => {
                        const d = Number(e.target.value) || 120;
                        setTimerDuration(d);
                        resetTimer(d);
                      }}
                      className="rounded-sm border-light-outline-variant text-xs font-mono font-bold py-1.5 px-3 focus:border-light-primary"
                    >
                      <option value={120}>Tanda de 3 flechas (120 s)</option>
                      <option value={240}>Tanda de 6 flechas (240 s)</option>
                      <option value={20}>Tirador individual / Match (20 s)</option>
                    </select>
                  </div>
                </div>

                <div
                  className="flex flex-col items-center justify-center p-8 rounded-sm bg-light-surface-container text-center transition-colors duration-300 border-2"
                  style={{
                    borderColor:
                      timerState === 'running'
                        ? timerRemaining > 30
                          ? '#10b981'
                          : '#f59e0b'
                        : timerState === 'emergency'
                        ? '#dc2626'
                        : '#717974',
                  }}
                >
                  <div
                    className={`font-headline text-title-lg uppercase tracking-wider mb-2 ${
                      timerState === 'running'
                        ? timerRemaining > 30
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                        : timerState === 'emergency'
                        ? 'text-red-600 font-bold'
                        : 'text-light-on-surface-variant'
                    }`}
                  >
                    {timerState === 'running'
                      ? timerRemaining > 30
                        ? '¡TIRO AUTORIZADO! (VERDE)'
                        : '¡ÚLTIMOS 30 SEGUNDOS! (ÁMBAR)'
                      : timerState === 'emergency'
                      ? '¡¡ALTO EL TIRO DE EMERGENCIA!!'
                      : timerState === 'paused'
                      ? 'SERIE PAUSADA'
                      : 'LÍNEA DE ESPERA (ROJO)'}
                  </div>

                  <div className="font-mono font-bold text-7xl md:text-8xl text-light-primary tracking-tight select-none my-2">
                    {formattedClock}
                  </div>

                  <div className="flex items-center gap-6 my-4">
                    <div
                      className={`w-8 h-8 rounded-full border-2 border-black/20 bg-red-600 ${
                        timerState === 'emergency'
                          ? 'shadow-lg animate-ping'
                          : timerState === 'running'
                          ? 'opacity-25'
                          : 'shadow-md'
                      }`}
                    />
                    <div
                      className={`w-8 h-8 rounded-full border-2 border-black/20 bg-amber-400 ${
                        timerState === 'running' && timerRemaining <= 30
                          ? 'shadow-lg animate-pulse'
                          : 'opacity-25'
                      }`}
                    />
                    <div
                      className={`w-8 h-8 rounded-full border-2 border-black/20 bg-emerald-500 ${
                        timerState === 'running' && timerRemaining > 30 ? 'shadow-lg' : 'opacity-25'
                      }`}
                    />
                  </div>

                  <p className="font-body text-body-sm text-light-on-surface-variant max-w-md">
                    Pulsa «Iniciar serie» para escuchar los 2 pitidos de llamada a línea y comenzar la
                    cuenta atrás.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={startTimer}
                      className="px-6 py-2.5 rounded-sm bg-light-primary text-light-on-primary font-label text-label-md font-semibold hover:bg-light-primary-container transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-title-sm">play_arrow</span>
                      <span>Iniciar serie</span>
                    </button>
                    <button
                      type="button"
                      onClick={pauseTimer}
                      className="px-5 py-2.5 rounded-sm border border-light-outline-variant bg-light-surface text-light-on-surface font-label text-label-md hover:bg-light-surface-container transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-title-sm">pause</span>
                      <span>Pausar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => resetTimer(timerDuration)}
                      className="px-5 py-2.5 rounded-sm border border-light-outline-variant bg-light-surface text-light-on-surface font-label text-label-md hover:bg-light-surface-container transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-title-sm">replay</span>
                      <span>Reiniciar</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSoundEnabled((prev) => {
                          const next = !prev;
                          showToast(
                            next ? 'Silbatos de juez activados.' : 'Silbatos silenciados.',
                            'success'
                          );
                          return next;
                        });
                      }}
                      className="px-4 py-2.5 rounded-sm border border-light-outline-variant text-light-on-surface-variant hover:text-light-primary font-mono text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {soundEnabled ? 'volume_up' : 'volume_off'}
                      </span>
                      <span>{soundEnabled ? 'Silbatos: Activados' : 'Silbatos: Mudo'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={emergencyStop}
                      className="px-4 py-2.5 rounded-sm bg-light-error text-light-on-error font-label text-label-md hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">warning</span>
                      <span>¡Alto el tiro! (Emergencia)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PESTAÑA 4: HISTORIAL */}
        {activeTab === 'history' && (
          <section className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-headline text-headline-sm text-light-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-gold-accent">history</span>
                  <span>4. Mi Historial de Entrenamientos</span>
                </h2>
                <p className="font-body text-body-md text-light-on-surface-variant mt-1">
                  Sesiones guardadas de forma privada en el almacenamiento local de tu navegador.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportHistoryToCsv}
                  className="px-4 py-2 rounded-sm border border-light-outline-variant text-light-on-surface font-label text-label-md hover:bg-light-surface-container flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Exportar todo a CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (history.length === 0) {
                      showToast('No hay sesiones en el historial para borrar.', 'error');
                      return;
                    }
                    clearHistoryDialogRef.current?.showModal();
                  }}
                  className="px-4 py-2 rounded-sm border border-light-error/40 text-light-error font-label text-label-md hover:bg-light-error/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete_sweep</span>
                  <span>Borrar historial</span>
                </button>
              </div>
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-sm overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-light-surface-container text-light-on-surface border-b border-light-outline-variant font-headline uppercase text-xs">
                      <th className="p-3.5">Fecha</th>
                      <th className="p-3.5">Arquero</th>
                      <th className="p-3.5">Modalidad</th>
                      <th className="p-3.5">Distancia</th>
                      <th className="p-3.5 text-center">Flechas</th>
                      <th className="p-3.5 text-center">Puntos</th>
                      <th className="p-3.5 text-center">Promedio</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-outline-variant/60">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-light-on-surface-variant font-body">
                          No tienes sesiones guardadas todavía. Completa la ficha de tiro y pulsa «Guardar
                          en Historial».
                        </td>
                      </tr>
                    ) : (
                      history.map((s) => (
                        <tr key={s.id} className="hover:bg-light-surface-container-low transition-colors">
                          <td className="p-3.5 font-mono text-xs font-bold text-light-primary">{s.date}</td>
                          <td className="p-3.5 font-body text-xs font-semibold">{s.archer}</td>
                          <td className="p-3.5 font-body text-xs text-light-on-surface-variant">{s.bow}</td>
                          <td className="p-3.5 font-mono text-xs">{s.dist}</td>
                          <td className="p-3.5 text-center font-mono text-xs">{s.arrowsCount || 0}</td>
                          <td className="p-3.5 text-center font-mono text-sm font-bold text-light-primary">
                            {s.grandTotal || 0}
                          </td>
                          <td className="p-3.5 text-center font-mono text-xs font-semibold text-gold-accent">
                            {s.avg || '0.00'}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => loadSession(s)}
                                className="p-1.5 rounded-sm border border-light-outline-variant hover:bg-light-primary hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-xs">open_in_browser</span>
                                <span>Cargar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteSession(s.id)}
                                title="Eliminar sesión"
                                className="p-1.5 rounded-sm border border-light-error/40 text-light-error hover:bg-light-error hover:text-white transition-colors text-xs cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-xs">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Modal Estricto para confirmar borrado del historial local */}
      <dialog
        ref={clearHistoryDialogRef}
        className="w-[calc(100%-2rem)] max-w-md rounded-lg bg-white border border-light-outline-variant p-0 text-light-on-surface m-auto shadow-2xl"
      >
        <div className="bg-red-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">warning</span>
            <h3 className="font-display text-lg font-bold uppercase tracking-tight">
              Confirmar Borrado de Historial
            </h3>
          </div>
          <button
            type="button"
            onClick={() => clearHistoryDialogRef.current?.close()}
            className="text-white/80 hover:text-white p-1 rounded cursor-pointer"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-light-on-surface">
            ¿Estás seguro de que deseas eliminar permanentemente todas las sesiones guardadas en este
            navegador?
          </p>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => clearHistoryDialogRef.current?.close()}
              className="px-4 py-2 rounded text-xs font-medium text-light-outline hover:text-light-on-surface hover:bg-light-surface-container transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmClearAllHistory}
              className="px-4 py-2 rounded bg-light-secondary hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">delete_forever</span>
              <span>Borrar Todo</span>
            </button>
          </div>
        </div>
      </dialog>
    </main>
  );
}
