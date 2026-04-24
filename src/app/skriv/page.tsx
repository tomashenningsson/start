'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/PageHeader';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.split('');
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

type Mode = 'letters' | 'numbers';

const CANVAS_SIZE = 320;
const STROKE_WIDTH = 24;
const GRID = 14; // 14×14 coverage grid
const CELL = CANVAS_SIZE / GRID; // ~22.9px per cell
const SUCCESS_PCT = 95;

// Shared font/position so reference and mask exactly match
const FONT_SIZE = Math.round(CANVAS_SIZE * 0.76);
const CHAR_Y = Math.round(CANVAS_SIZE * 0.52); // center-ish with middle baseline

function drawReference(ctx: CanvasRenderingContext2D, char: string) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = '#f5f3ff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Horizontal baseline guide
  ctx.strokeStyle = '#ddd6fe';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(16, CHAR_Y + FONT_SIZE * 0.18);
  ctx.lineTo(CANVAS_SIZE - 16, CHAR_Y + FONT_SIZE * 0.18);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `bold ${FONT_SIZE}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(139, 92, 246, 0.18)';
  ctx.fillText(char, CANVAS_SIZE / 2, CHAR_Y);
}

// Build a set of which 14×14 grid cells are "inside" the character
function buildValidCells(char: string): Set<string> {
  const oc = document.createElement('canvas');
  oc.width = CANVAS_SIZE;
  oc.height = CANVAS_SIZE;
  const ctx = oc.getContext('2d')!;

  // Black background, white letter — slightly larger for forgiving hit zone
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.font = `bold ${Math.round(FONT_SIZE * 1.12)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(char, CANVAS_SIZE / 2, CHAR_Y);

  const data = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
  const valid = new Set<string>();

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      // Sample 3×3 points inside cell; cell is valid if majority are white
      let hits = 0;
      for (let sy = 0; sy < 3; sy++) {
        for (let sx = 0; sx < 3; sx++) {
          const px = Math.floor(gx * CELL + (sx + 0.5) * CELL / 3);
          const py = Math.floor(gy * CELL + (sy + 0.5) * CELL / 3);
          const i = (py * CANVAS_SIZE + px) * 4;
          if (data[i] > 80) hits++;
        }
      }
      if (hits >= 5) valid.add(`${gx},${gy}`); // majority of 9 samples
    }
  }
  return valid;
}

function isInsideValid(validCells: Set<string>, x: number, y: number): boolean {
  const gx = Math.floor(x / CELL);
  const gy = Math.floor(y / CELL);
  return validCells.has(`${gx},${gy}`);
}

interface TracingCanvasProps {
  char: string;
  onProgress: (pct: number) => void;
}

function TracingCanvas({ char, onProgress }: TracingCanvasProps) {
  const refCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const validCellsRef = useRef<Set<string>>(new Set());
  const coveredCellsRef = useRef<Set<string>>(new Set());
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  // Cache the canvas rect at stroke-start so viewport resize mid-stroke can't shift coords
  const strokeRectRef = useRef<DOMRect | null>(null);
  // Ref so touch effect always calls the latest onProgress without re-attaching listeners
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  // Initialise canvases when character changes
  useEffect(() => {
    const refCanvas = refCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!refCanvas || !drawCanvas) return;
    drawReference(refCanvas.getContext('2d')!, char);
    drawCanvas.getContext('2d')!.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    validCellsRef.current = buildValidCells(char);
    coveredCellsRef.current = new Set();
    onProgressRef.current(0);
  }, [char]);

  // Convert viewport coords → canvas coords using a pre-captured DOMRect
  function toCanvas(clientX: number, clientY: number, rect: DOMRect) {
    return {
      x: (clientX - rect.left) * (CANVAS_SIZE / rect.width),
      y: (clientY - rect.top) * (CANVAS_SIZE / rect.height),
    };
  }

  function paintLine(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    inside: boolean,
  ) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = inside ? 'rgba(99, 102, 241, 0.78)' : 'rgba(239, 68, 68, 0.72)';
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function updateCoverage(x: number, y: number) {
    const valid = validCellsRef.current;
    const covered = coveredCellsRef.current;
    const r = Math.ceil(STROKE_WIDTH / 2 / CELL) + 1;
    const cgx = Math.floor(x / CELL);
    const cgy = Math.floor(y / CELL);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const key = `${cgx + dx},${cgy + dy}`;
        if (valid.has(key)) covered.add(key);
      }
    }
    onProgressRef.current(
      Math.min(100, Math.round((covered.size / Math.max(valid.size, 1)) * 100))
    );
  }

  // ── Touch events: native non-passive listeners so preventDefault() stops page scroll ──
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      if (!e.touches.length) return;
      isDrawingRef.current = true;
      // Capture rect ONCE per stroke — immune to Safari toolbar show/hide mid-drag
      strokeRectRef.current = canvas.getBoundingClientRect();
      const t = e.touches[0];
      lastPosRef.current = toCanvas(t.clientX, t.clientY, strokeRectRef.current);
    };

    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawingRef.current || !e.touches.length || !strokeRectRef.current) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const t = e.touches[0];
      const pos = toCanvas(t.clientX, t.clientY, strokeRectRef.current);
      const last = lastPosRef.current ?? pos;
      paintLine(ctx, last, pos, isInsideValid(validCellsRef.current, pos.x, pos.y));
      updateCoverage(pos.x, pos.y);
      lastPosRef.current = pos;
    };

    const onEnd = (e: TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = false;
      lastPosRef.current = null;
      strokeRectRef.current = null;
    };

    const opts: AddEventListenerOptions = { passive: false };
    canvas.addEventListener('touchstart', onStart, opts);
    canvas.addEventListener('touchmove', onMove, opts);
    canvas.addEventListener('touchend', onEnd, opts);
    canvas.addEventListener('touchcancel', onEnd, opts);
    return () => {
      canvas.removeEventListener('touchstart', onStart, opts);
      canvas.removeEventListener('touchmove', onMove, opts);
      canvas.removeEventListener('touchend', onEnd, opts);
      canvas.removeEventListener('touchcancel', onEnd, opts);
    };
  }, []); // empty — all access via stable refs

  // ── Mouse events: React synthetic handlers are fine for mouse ──
  const onMouseDown = (e: React.MouseEvent) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    strokeRectRef.current = canvas.getBoundingClientRect(); // cache once per stroke
    lastPosRef.current = toCanvas(e.clientX, e.clientY, strokeRectRef.current);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current || !strokeRectRef.current) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = toCanvas(e.clientX, e.clientY, strokeRectRef.current);
    const last = lastPosRef.current ?? pos;
    paintLine(ctx, last, pos, isInsideValid(validCellsRef.current, pos.x, pos.y));
    updateCoverage(pos.x, pos.y);
    lastPosRef.current = pos;
  };
  const onMouseUp = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
    strokeRectRef.current = null;
  };

  const clear = () => {
    drawCanvasRef.current?.getContext('2d')!.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    coveredCellsRef.current = new Set();
    onProgressRef.current(0);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* touch-action:none on wrapper + canvas prevents iOS rubber-band / momentum scroll */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-xl ring-2 ring-violet-200"
        style={{ width: '100%', maxWidth: CANVAS_SIZE, aspectRatio: '1', touchAction: 'none' }}
      >
        <canvas ref={refCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
          className="absolute inset-0 w-full h-full" />
        <canvas ref={drawCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{ touchAction: 'none' }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        />
      </div>
      <button onClick={clear}
        className="text-sm font-black text-gray-400 hover:text-gray-600 bg-white/80 rounded-full px-4 py-1.5 ring-1 ring-gray-200 transition-colors shadow-sm"
      >
        🗑️ Rensa
      </button>
    </div>
  );
}

export default function SkrivPage() {
  const [mode, setMode] = useState<Mode>('letters');
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const items = mode === 'letters' ? LETTERS : NUMBERS;
  const current = items[idx];
  const isSuccess = progress >= SUCCESS_PCT;

  const handleProgress = useCallback((pct: number) => setProgress(pct), []);

  const goTo = (i: number) => { setIdx(i); setProgress(0); };
  const goNext = () => goTo((idx + 1) % items.length);
  const goPrev = () => goTo((idx - 1 + items.length) % items.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-12 overscroll-none">
      <PageHeader title="Skriv" emoji="✏️" />

      {/* Mode tabs */}
      <div className="flex gap-2 justify-center px-4 pt-5 mb-5">
        {(['letters', 'numbers'] as Mode[]).map(m => (
          <button key={m}
            onClick={() => { setMode(m); setIdx(0); setProgress(0); }}
            className={`px-5 py-2.5 rounded-full font-black text-sm transition-all ${
              mode === m ? 'bg-orange-400 text-white shadow-md scale-105'
                        : 'bg-white/80 text-gray-600 hover:bg-white ring-1 ring-gray-200'
            }`}
          >
            {m === 'letters' ? '🔤 Bokstäver' : '🔢 Siffror'}
          </button>
        ))}
      </div>

      {/* Character navigation */}
      <div className="flex items-center justify-center gap-4 mb-3 px-4">
        <button onClick={goPrev}
          className="text-2xl font-black text-gray-400 hover:text-gray-600 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center ring-1 ring-gray-200 transition-colors"
        >‹</button>
        <div className="text-center min-w-[60px]">
          <div className="text-6xl font-black text-gray-800 select-none">{current}</div>
          {mode === 'letters' && (
            <div className="text-base font-bold text-gray-400 mt-0.5">{current.toLowerCase()}</div>
          )}
        </div>
        <button onClick={goNext}
          className="text-2xl font-black text-gray-400 hover:text-gray-600 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center ring-1 ring-gray-200 transition-colors"
        >›</button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 px-8 mb-2 max-w-xs mx-auto">
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden ring-1 ring-gray-200">
          <div
            className={`h-full rounded-full transition-all duration-200 ${isSuccess ? 'bg-green-400' : 'bg-violet-400'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={`text-sm font-black w-8 text-right ${isSuccess ? 'text-green-500' : 'text-gray-400'}`}>
          {isSuccess ? '⭐' : `${progress}%`}
        </span>
      </div>

      <p className="text-center text-xs font-bold text-gray-400 mb-3 px-4">
        Rita {mode === 'letters' ? 'bokstaven' : 'siffran'} med fingret eller musen
        {'  ·  '}
        <span className="text-violet-400">Blått = rätt</span>
        {'  ·  '}
        <span className="text-red-400">Rött = utanför</span>
      </p>

      {/* Canvas */}
      <div className="px-6 max-w-sm mx-auto w-full">
        <TracingCanvas key={`${mode}-${idx}`} char={current} onProgress={handleProgress} />
      </div>

      {/* Success overlay — fixed so it never shifts the canvas position */}
      {isSuccess && (
        <div className="fixed inset-x-0 top-1/3 flex justify-center pointer-events-none z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-8 py-4 shadow-2xl border border-green-200 animate-bounce">
            <p className="text-2xl font-black text-green-600 text-center">Bra jobbat! 🎉</p>
          </div>
        </div>
      )}

      {/* Navigation dots */}
      <div className="flex justify-center gap-1.5 mt-4 px-4 flex-wrap max-w-sm mx-auto">
        {items.map((item, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`w-7 h-7 rounded-full text-xs font-black transition-all ${
              i === idx ? 'bg-orange-400 text-white scale-110 shadow'
                       : 'bg-white/80 text-gray-500 ring-1 ring-gray-200 hover:bg-white'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
