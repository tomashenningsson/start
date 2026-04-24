'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { wordList } from '@/data/words';
import { useSpeech } from '@/hooks/useSpeech';
import { useProgress } from '@/hooks/useProgress';
import { Celebration } from '@/components/Celebration';
import { PageHeader } from '@/components/PageHeader';

const SWEDISH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ';
const FULL_ALPHABET = SWEDISH.split('');

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildAvailable(word: string, level: 1 | 2 | 3) {
  if (level === 3) {
    return FULL_ALPHABET.map((char, id) => ({ char, id, placed: false, isAlpha: true }));
  }
  const extraCount = level === 1 ? 0 : 2;
  const wordChars = word.split('');
  const extras = shuffle(SWEDISH.split('').filter(c => !wordChars.includes(c))).slice(0, extraCount);
  return shuffle([...wordChars, ...extras]).map((char, id) => ({ char, id, placed: false, isAlpha: false }));
}

type Level = 1 | 2 | 3;
type AvailLetter = { char: string; id: number; placed: boolean; isAlpha: boolean };

export default function OrdPage() {
  const [level, setLevel] = useState<Level>(1);
  const [wordIdx, setWordIdx] = useState(0);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [avail, setAvail] = useState<AvailLetter[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [wrongMsg, setWrongMsg] = useState(false);

  // Drag state — position only needs to be in React state for rendering the ghost
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [dragLetter, setDragLetter] = useState<AvailLetter | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const { speak } = useSpeech();
  const { progress, completeWord } = useProgress();

  // Refs for inside the stable pointer-event effect
  const isDraggingRef = useRef(false);
  const dragLetterRef = useRef<AvailLetter | null>(null);
  const justPlacedRef = useRef(false);
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Keep a fresh reference to the placement handler so the effect never goes stale
  const placeRef = useRef<(letter: AvailLetter, slotIdx: number) => void>(() => {});

  const levelWords = wordList.filter(w => w.level === level);
  const current = levelWords[wordIdx % levelWords.length];

  const initWord = useCallback((word: typeof current, lvl: Level) => {
    setSlots(Array(word.word.length).fill(null));
    setAvail(buildAvailable(word.word, lvl));
    setCelebrating(false);
    setShaking(false);
    setWrongMsg(false);
    speak(word.hint);
  }, [speak]);

  useEffect(() => {
    initWord(current, level);
  }, [current, level, initWord]);

  // Place a dragged letter into a specific slot
  const placeLetterInSlot = (letter: AvailLetter, slotIdx: number) => {
    if (celebrating || slots[slotIdx] !== null) return;
    if (letter.placed && !letter.isAlpha) return;

    const newSlots = [...slots];
    newSlots[slotIdx] = `${letter.char}:${letter.id}`;
    setSlots(newSlots);

    if (!letter.isAlpha) {
      setAvail(prev => prev.map(l => l.id === letter.id ? { ...l, placed: true } : l));
    }

    const filled = newSlots.filter(Boolean);
    if (filled.length === current.word.length) {
      const formed = newSlots.map(s => s!.split(':')[0]).join('');
      if (formed === current.word) {
        setCelebrating(true);
        completeWord(current.word);
        speak('Bra jobbat!');
      } else {
        setShaking(true);
        setWrongMsg(true);
        setTimeout(() => {
          setShaking(false);
          setWrongMsg(false);
          setSlots(Array(current.word.length).fill(null));
          setAvail(prev => prev.map(l => l.isAlpha ? l : { ...l, placed: false }));
        }, 900);
      }
    }
  };

  // Always point to the latest version of the placement function
  placeRef.current = placeLetterInSlot;

  // Find which slot index is under a given viewport coordinate
  const slotAt = (x: number, y: number): number => {
    return slotRefs.current.findIndex(ref => {
      if (!ref) return false;
      const r = ref.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
  };

  // Mount global pointer handlers once — all mutable access goes through refs
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      setDragPos({ x: e.clientX, y: e.clientY });
      const idx = slotAt(e.clientX, e.clientY);
      setHoveredSlot(idx >= 0 ? idx : null);
    };

    const onUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const idx = slotAt(e.clientX, e.clientY);
      if (idx >= 0 && dragLetterRef.current) {
        justPlacedRef.current = true;
        setTimeout(() => { justPlacedRef.current = false; }, 80);
        placeRef.current(dragLetterRef.current, idx);
      }
      dragLetterRef.current = null;
      setDragLetter(null);
      setDragPos(null);
      setHoveredSlot(null);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []); // stable — everything mutable accessed via refs

  const handleLetterPointerDown = (e: React.PointerEvent, letter: AvailLetter) => {
    if ((letter.placed && !letter.isAlpha) || celebrating) return;
    e.preventDefault();
    isDraggingRef.current = true;
    dragLetterRef.current = letter;
    setDragLetter(letter);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handleSlotClick = (idx: number) => {
    if (justPlacedRef.current) return; // ignore click fired right after a drop
    const content = slots[idx];
    if (!content || celebrating) return;
    const letterId = parseInt(content.split(':')[1]);
    const newSlots = [...slots];
    newSlots[idx] = null;
    setSlots(newSlots);
    setAvail(prev => prev.map(l => {
      if (l.id !== letterId) return l;
      return l.isAlpha ? l : { ...l, placed: false };
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 pb-12 select-none">
      <PageHeader
        title="Ordpusslet"
        emoji="🧩"
        rightContent={
          <span className="text-sm font-black text-gray-500 bg-white/80 rounded-full px-3 py-1 ring-1 ring-gray-200">
            ⭐ {progress.completedWords.length} ord
          </span>
        }
      />

      {/* Level tabs */}
      <div className="flex gap-2 justify-center px-4 pt-5">
        {([1, 2, 3] as Level[]).map(l => (
          <button
            key={l}
            onClick={() => { setLevel(l); setWordIdx(0); }}
            className={`px-5 py-2.5 rounded-full font-black text-sm transition-all ${
              level === l
                ? 'bg-green-500 text-white shadow-md scale-105'
                : 'bg-white/80 text-gray-600 hover:bg-white ring-1 ring-gray-200'
            }`}
          >
            {'⭐'.repeat(l)} Nivå {l}
          </button>
        ))}
      </div>

      {/* Word hint */}
      <div className="flex flex-col items-center mt-7 mb-5 px-4 text-center">
        <div className="text-8xl md:text-9xl mb-4">{current.emoji}</div>
        <p className="text-lg font-bold text-gray-400">Vad heter detta?</p>
        <button
          onClick={() => speak(current.hint)}
          className="mt-1 text-sky-500 font-bold text-sm hover:text-sky-700 transition-colors"
        >
          🔊 Lyssna
        </button>
      </div>

      {/* Letter slots — drop targets */}
      <div className={`flex justify-center gap-2 px-4 mb-3 ${shaking ? 'animate-shake' : ''}`}>
        {slots.map((slot, i) => {
          const letter = slot ? slot.split(':')[0] : null;
          const isHovered = hoveredSlot === i && letter === null && dragPos !== null;
          return (
            <button
              key={i}
              ref={el => { slotRefs.current[i] = el; }}
              onClick={() => handleSlotClick(i)}
              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all duration-150 ${
                letter
                  ? shaking
                    ? 'bg-red-100 border-red-400 text-red-600'
                    : 'bg-green-100 border-green-400 text-green-700 active:scale-90'
                  : isHovered
                  ? 'bg-amber-50 border-amber-400 scale-110 shadow-lg border-solid'
                  : 'bg-white/60 border-dashed border-gray-300'
              }`}
            >
              {letter ?? (
                <span className="text-gray-200 text-lg">{current.word[i]}</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs font-bold text-gray-400 mb-5 px-4">
        Dra bokstäverna till rätt ruta · Tryck på en ruta för att ta tillbaka bokstaven
      </p>

      {wrongMsg && (
        <p className="text-center text-red-500 font-black text-lg mb-4 animate-bounce">
          Försök igen! 💪
        </p>
      )}

      {/* Available letters — drag source */}
      <div className={`flex flex-wrap justify-center gap-3 px-6 mx-auto ${level === 3 ? 'max-w-lg' : 'max-w-sm md:max-w-md'}`}>
        {avail.map(letter => {
          const isPlaced = !letter.isAlpha && letter.placed;
          const isBeingDragged = dragLetter?.id === letter.id && !letter.isAlpha;
          return (
            <button
              key={letter.id}
              onPointerDown={e => handleLetterPointerDown(e, letter)}
              disabled={isPlaced}
              style={{ touchAction: 'none' }}
              className={`w-[52px] h-[52px] md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-md transition-all ${
                isPlaced
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-30 scale-90'
                  : isBeingDragged
                  ? 'bg-gradient-to-br from-amber-200 to-orange-300 text-white opacity-40 scale-90'
                  : 'bg-gradient-to-br from-amber-300 to-orange-400 text-white hover:shadow-lg cursor-grab active:cursor-grabbing'
              }`}
            >
              {letter.char}
            </button>
          );
        })}
      </div>

      {celebrating && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setWordIdx(i => i + 1)}
            className="px-10 py-4 rounded-3xl bg-green-500 text-white font-black text-xl shadow-lg hover:bg-green-600 active:scale-95 transition-all"
          >
            Nästa ord ➡️
          </button>
        </div>
      )}

      <Celebration active={celebrating} onComplete={() => {}} />

      {/* Dragging ghost — floats above everything, centered slightly above finger */}
      {dragPos && dragLetter && (
        <div
          className="fixed pointer-events-none z-50 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-2xl"
          style={{
            left: dragPos.x - 28,
            top: dragPos.y - 56,
            transform: 'scale(1.2)',
          }}
        >
          {dragLetter.char}
        </div>
      )}
    </div>
  );
}
