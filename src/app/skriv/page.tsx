'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/PageHeader';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.split('');
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

type Mode = 'letters' | 'numbers';

const CANVAS_SIZE = 320;
const STROKE_WIDTH = 18;

// Draw reference character on an offscreen canvas, return the ImageData for hit-testing
function drawReference(ctx: CanvasRenderingContext2D, char: string) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = '#f8f7ff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Guide lines
  ctx.strokeStyle = '#ddd6fe';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_SIZE / 2);
  ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CANVAS_SIZE / 2, 0);
  ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
  ctx.stroke();
  ctx.setLineDash([]);

  // Reference character — thick, semi-transparent as guide
  ctx.font = `bold ${CANVAS_SIZE * 0.72}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(167, 139, 250, 0.18)';
  ctx.fillText(char, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + CANVAS_SIZE * 0.04);
}

// Create an offscreen mask canvas where filled pixels are the "valid" area
function buildMask(char: string): ImageData {
  const oc = document.createElement('canvas');
  oc.width = CANVAS_SIZE;
  oc.height = CANVAS_SIZE;
  const octx = oc.getContext('2d')!;
  octx.fillStyle = '#000';
  octx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  // Draw with generous margin — the valid zone is large so tracing is forgiving
  const margin = CANVAS_SIZE * 0.08;
  octx.font = `bold ${CANVAS_SIZE * 0.72 + margin * 2}px Arial, sans-serif`;
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.fillStyle = '#fff';
  octx.fillText(char, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + CANVAS_SIZE * 0.04);
  return octx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function isInsideMask(mask: ImageData, x: number, y: number): boolean {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || xi >= CANVAS_SIZE || yi < 0 || yi >= CANVAS_SIZE) return false;
  const idx = (yi * CANVAS_SIZE + xi) * 4;
  return mask.data[idx] > 128; // white pixel = inside
}

interface TracingCanvasProps {
  char: string;
  onProgress: (pct: number) => void;
}

function TracingCanvas({ char, onProgress }: TracingCanvasProps) {
  const refCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<ImageData | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const coveredPixelsRef = useRef(new Set<string>());
  const totalMaskPixelsRef = useRef(0);

  // Initialize reference canvas and mask when char changes
  useEffect(() => {
    const refCanvas = refCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!refCanvas || !drawCanvas) return;

    const refCtx = refCanvas.getContext('2d')!;
    drawReference(refCtx, char);

    const drawCtx = drawCanvas.getContext('2d')!;
    drawCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const mask = buildMask(char);
    maskRef.current = mask;
    coveredPixelsRef.current = new Set();

    // Count total valid pixels for progress calculation
    let total = 0;
    for (let i = 0; i < mask.data.length; i += 4 * 4) { // sample every 4th pixel
      if (mask.data[i] > 128) total++;
    }
    totalMaskPixelsRef.current = Math.max(total, 1);
    onProgress(0);
  }, [char, onProgress]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const drawLine = useCallback((
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    inside: boolean
  ) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = inside ? 'rgba(99, 102, 241, 0.75)' : 'rgba(239, 68, 68, 0.75)';
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, []);

  const updateProgress = useCallback((x: number, y: number) => {
    const mask = maskRef.current;
    if (!mask) return;
    // Mark a small area around the draw point as covered
    const r = Math.floor(STROKE_WIDTH / 2 / 4); // sample radius
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const px = Math.round((x + dx * 4) / 4);
        const py = Math.round((y + dy * 4) / 4);
        const key = `${px},${py}`;
        if (!coveredPixelsRef.current.has(key)) {
          const xi = px * 4;
          const yi = py * 4;
          const idx = (yi * CANVAS_SIZE + xi) * 4;
          if (idx >= 0 && idx < mask.data.length && mask.data[idx] > 128) {
            coveredPixelsRef.current.add(key);
          }
        }
      }
    }
    const pct = Math.min(100, Math.round((coveredPixelsRef.current.size / totalMaskPixelsRef.current) * 100));
    onProgress(pct);
  }, [onProgress]);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    lastPosRef.current = getPos(e, canvas);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    const last = lastPosRef.current ?? pos;
    const inside = isInsideMask(maskRef.current!, pos.x, pos.y);
    drawLine(ctx, last, pos, inside);
    updateProgress(pos.x, pos.y);
    lastPosRef.current = pos;
  }, [getPos, drawLine, updateProgress]);

  const endDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }, []);

  const clearDrawing = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    coveredPixelsRef.current = new Set();
    onProgress(0);
  }, [onProgress]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative rounded-3xl overflow-hidden shadow-xl ring-2 ring-violet-200 touch-none"
        style={{ width: '100%', maxWidth: CANVAS_SIZE, aspectRatio: '1' }}
      >
        {/* Reference layer */}
        <canvas
          ref={refCanvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="absolute inset-0 w-full h-full"
        />
        {/* Drawing layer */}
        <canvas
          ref={drawCanvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          onTouchCancel={endDraw}
        />
      </div>
      <button
        onClick={clearDrawing}
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
  const isSuccess = progress >= 65;

  const goNext = () => {
    setIdx(i => (i + 1) % items.length);
    setProgress(0);
  };
  const goPrev = () => {
    setIdx(i => (i - 1 + items.length) % items.length);
    setProgress(0);
  };

  // Reset progress when mode or idx changes
  const handleProgress = useCallback((pct: number) => {
    setProgress(pct);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-12">
      <PageHeader title="Skriv" emoji="✏️" />

      {/* Mode tabs */}
      <div className="flex gap-2 justify-center px-4 pt-5 mb-6">
        {(['letters', 'numbers'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setIdx(0); setProgress(0); }}
            className={`px-5 py-2.5 rounded-full font-black text-sm transition-all ${
              mode === m
                ? 'bg-orange-400 text-white shadow-md scale-105'
                : 'bg-white/80 text-gray-600 hover:bg-white ring-1 ring-gray-200'
            }`}
          >
            {m === 'letters' ? '🔤 Bokstäver' : '🔢 Siffror'}
          </button>
        ))}
      </div>

      {/* Character display */}
      <div className="flex items-center justify-center gap-4 mb-4 px-4">
        <button
          onClick={goPrev}
          className="text-2xl font-black text-gray-400 hover:text-gray-600 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center ring-1 ring-gray-200 transition-colors"
        >
          ‹
        </button>
        <div className="text-center">
          <div className="text-6xl font-black text-gray-800 select-none">{current}</div>
          {mode === 'letters' && (
            <div className="text-base font-bold text-gray-400 mt-1">
              {current.toLowerCase()}
            </div>
          )}
        </div>
        <button
          onClick={goNext}
          className="text-2xl font-black text-gray-400 hover:text-gray-600 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center ring-1 ring-gray-200 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 px-8 mb-4 max-w-xs mx-auto">
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden ring-1 ring-gray-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isSuccess ? 'bg-green-400' : 'bg-violet-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={`text-sm font-black ${isSuccess ? 'text-green-500' : 'text-gray-400'}`}>
          {isSuccess ? '⭐' : `${progress}%`}
        </span>
      </div>

      {isSuccess && (
        <div className="text-center text-lg font-black text-green-600 mb-3 animate-bounce">
          Bra jobbat! 🎉
        </div>
      )}

      {/* Instructions */}
      <p className="text-center text-sm font-bold text-gray-400 mb-4 px-4">
        Rita {mode === 'letters' ? 'bokstaven' : 'siffran'} med fingret eller musen
        <br />
        <span className="text-violet-400">Blått = rätt</span>
        {' · '}
        <span className="text-red-400">Rött = utanför</span>
      </p>

      {/* Canvas */}
      <div className="px-6 max-w-sm mx-auto w-full">
        <TracingCanvas key={`${mode}-${idx}`} char={current} onProgress={handleProgress} />
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-1.5 mt-5 px-4 flex-wrap max-w-xs mx-auto">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); setProgress(0); }}
            className={`w-7 h-7 rounded-full text-xs font-black transition-all ${
              i === idx
                ? 'bg-orange-400 text-white scale-110 shadow'
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
