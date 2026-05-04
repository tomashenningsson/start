import type { GameTheme } from '@/components/GameBackground';

export const GAME_THEMES: Record<string, GameTheme> = {
  bokstaver: {
    gradient: 'linear-gradient(160deg, #1a000e 0%, #4a0030 18%, #80104a 35%, #3a0060 58%, #1a000e 100%)',
    orbs: [
      { color: '#f43f5e', position: { top: '-10%', right: '-8%' }, animation: 'animate-aurora-1', size: '440px', opacity: 0.35 },
      { color: '#a855f7', position: { bottom: '8%', left: '-10%' }, animation: 'animate-aurora-2', size: '360px', opacity: 0.28 },
      { color: '#ec4899', position: { top: '40%', right: '18%' }, animation: 'animate-aurora-3', size: '280px', opacity: 0.22 },
      { color: '#db2777', position: { top: '18%', left: '12%' }, animation: 'animate-aurora-1', size: '240px', opacity: 0.18 },
    ],
    floats: [
      { emoji: '🎯', position: { top: '8%', left: '4%' }, animation: 'animate-float-1', size: '1.8rem' },
      { emoji: '✨', position: { top: '22%', right: '6%' }, animation: 'animate-float-2', size: '1.4rem' },
      { emoji: '📝', position: { top: '55%', left: '3%' }, animation: 'animate-float-3', size: '1.5rem' },
      { emoji: '⭐', position: { bottom: '28%', right: '5%' }, animation: 'animate-float-1', size: '1.3rem' },
      { emoji: '🔤', position: { bottom: '15%', left: '8%' }, animation: 'animate-float-2', size: '1.6rem' },
    ],
  },

  siffror: {
    gradient: 'linear-gradient(160deg, #000d1e 0%, #002040 18%, #004060 35%, #002a50 58%, #000d1e 100%)',
    orbs: [
      { color: '#38bdf8', position: { top: '-8%', right: '-6%' }, animation: 'animate-aurora-1', size: '420px', opacity: 0.32 },
      { color: '#14b8a6', position: { bottom: '10%', left: '-8%' }, animation: 'animate-aurora-2', size: '360px', opacity: 0.25 },
      { color: '#06b6d4', position: { top: '42%', right: '20%' }, animation: 'animate-aurora-3', size: '300px', opacity: 0.22 },
      { color: '#0ea5e9', position: { top: '20%', left: '8%' }, animation: 'animate-aurora-2', size: '220px', opacity: 0.18 },
    ],
    floats: [
      { emoji: '🔢', position: { top: '7%', left: '5%' }, animation: 'animate-float-1', size: '1.8rem' },
      { emoji: '⭐', position: { top: '20%', right: '5%' }, animation: 'animate-float-3', size: '1.4rem' },
      { emoji: '🌊', position: { top: '50%', left: '3%' }, animation: 'animate-float-2', size: '1.5rem' },
      { emoji: '✨', position: { bottom: '30%', right: '6%' }, animation: 'animate-float-1', size: '1.3rem' },
      { emoji: '💫', position: { bottom: '15%', left: '7%' }, animation: 'animate-float-3', size: '1.5rem' },
    ],
  },

  ord: {
    gradient: 'linear-gradient(160deg, #001008 0%, #002c18 18%, #005030 35%, #001a30 58%, #001008 100%)',
    orbs: [
      { color: '#4ade80', position: { top: '-10%', right: '-8%' }, animation: 'animate-aurora-1', size: '420px', opacity: 0.3 },
      { color: '#14b8a6', position: { bottom: '8%', left: '-10%' }, animation: 'animate-aurora-2', size: '360px', opacity: 0.25 },
      { color: '#22c55e', position: { top: '40%', right: '15%' }, animation: 'animate-aurora-3', size: '300px', opacity: 0.2 },
      { color: '#10b981', position: { top: '22%', left: '10%' }, animation: 'animate-aurora-1', size: '240px', opacity: 0.18 },
    ],
    floats: [
      { emoji: '🧩', position: { top: '8%', left: '4%' }, animation: 'animate-float-2', size: '1.8rem' },
      { emoji: '🌿', position: { top: '20%', right: '6%' }, animation: 'animate-float-1', size: '1.5rem' },
      { emoji: '✨', position: { top: '55%', left: '3%' }, animation: 'animate-float-3', size: '1.3rem' },
      { emoji: '📖', position: { bottom: '28%', right: '5%' }, animation: 'animate-float-2', size: '1.5rem' },
      { emoji: '⭐', position: { bottom: '14%', left: '8%' }, animation: 'animate-float-1', size: '1.3rem' },
    ],
  },

  matte: {
    gradient: 'linear-gradient(160deg, #0f0020 0%, #280055 18%, #500090 35%, #400040 58%, #0f0020 100%)',
    orbs: [
      { color: '#a855f7', position: { top: '-10%', right: '-8%' }, animation: 'animate-aurora-1', size: '440px', opacity: 0.35 },
      { color: '#f43f5e', position: { bottom: '8%', left: '-10%' }, animation: 'animate-aurora-2', size: '360px', opacity: 0.28 },
      { color: '#c026d3', position: { top: '42%', right: '18%' }, animation: 'animate-aurora-3', size: '300px', opacity: 0.22 },
      { color: '#7c3aed', position: { top: '20%', left: '10%' }, animation: 'animate-aurora-2', size: '250px', opacity: 0.2 },
    ],
    floats: [
      { emoji: '🌋', position: { top: '8%', left: '5%' }, animation: 'animate-float-1', size: '1.8rem' },
      { emoji: '⭐', position: { top: '22%', right: '6%' }, animation: 'animate-float-2', size: '1.4rem' },
      { emoji: '🔮', position: { top: '55%', left: '3%' }, animation: 'animate-float-3', size: '1.6rem' },
      { emoji: '✨', position: { bottom: '30%', right: '5%' }, animation: 'animate-float-1', size: '1.3rem' },
      { emoji: '💜', position: { bottom: '14%', left: '8%' }, animation: 'animate-float-2', size: '1.4rem' },
    ],
  },

  skriv: {
    gradient: 'linear-gradient(160deg, #150800 0%, #3a1800 18%, #652400 35%, #450f00 58%, #150800 100%)',
    orbs: [
      { color: '#fb923c', position: { top: '-10%', right: '-8%' }, animation: 'animate-aurora-1', size: '420px', opacity: 0.35 },
      { color: '#ef4444', position: { bottom: '8%', left: '-10%' }, animation: 'animate-aurora-2', size: '360px', opacity: 0.28 },
      { color: '#f59e0b', position: { top: '40%', right: '18%' }, animation: 'animate-aurora-3', size: '290px', opacity: 0.22 },
      { color: '#f97316', position: { top: '20%', left: '10%' }, animation: 'animate-aurora-1', size: '240px', opacity: 0.18 },
    ],
    floats: [
      { emoji: '🖊️', position: { top: '8%', left: '4%' }, animation: 'animate-float-1', size: '1.8rem' },
      { emoji: '✏️', position: { top: '22%', right: '6%' }, animation: 'animate-float-2', size: '1.5rem' },
      { emoji: '✨', position: { top: '55%', left: '3%' }, animation: 'animate-float-3', size: '1.3rem' },
      { emoji: '⭐', position: { bottom: '28%', right: '5%' }, animation: 'animate-float-1', size: '1.4rem' },
      { emoji: '🌟', position: { bottom: '14%', left: '7%' }, animation: 'animate-float-2', size: '1.3rem' },
    ],
  },

  godis: {
    gradient: 'linear-gradient(160deg, #180015 0%, #400038 18%, #700060 35%, #400075 58%, #180015 100%)',
    orbs: [
      { color: '#e879f9', position: { top: '-10%', right: '-8%' }, animation: 'animate-aurora-1', size: '440px', opacity: 0.35 },
      { color: '#a855f7', position: { bottom: '8%', left: '-10%' }, animation: 'animate-aurora-2', size: '360px', opacity: 0.28 },
      { color: '#ec4899', position: { top: '40%', right: '18%' }, animation: 'animate-aurora-3', size: '300px', opacity: 0.22 },
      { color: '#d946ef', position: { top: '22%', left: '10%' }, animation: 'animate-aurora-1', size: '240px', opacity: 0.2 },
    ],
    floats: [
      { emoji: '🍬', position: { top: '8%', left: '4%' }, animation: 'animate-float-2', size: '1.8rem' },
      { emoji: '🍭', position: { top: '22%', right: '6%' }, animation: 'animate-float-1', size: '1.5rem' },
      { emoji: '✨', position: { top: '55%', left: '3%' }, animation: 'animate-float-3', size: '1.3rem' },
      { emoji: '⭐', position: { bottom: '28%', right: '5%' }, animation: 'animate-float-2', size: '1.4rem' },
      { emoji: '💜', position: { bottom: '14%', left: '8%' }, animation: 'animate-float-1', size: '1.3rem' },
    ],
  },

  draken: {
    gradient: 'linear-gradient(160deg, #5eead4 0%, #67e8f9 22%, #c4b5fd 50%, #f9a8d4 78%, #fde68a 100%)',
    orbs: [
      { color: '#a855f7', position: { top: '-10%', right: '-8%' }, animation: 'animate-aurora-1', size: '440px', opacity: 0.45 },
      { color: '#f472b6', position: { bottom: '8%', left: '-10%' }, animation: 'animate-aurora-2', size: '380px', opacity: 0.38 },
      { color: '#facc15', position: { top: '40%', right: '15%' }, animation: 'animate-aurora-3', size: '300px', opacity: 0.32 },
      { color: '#22d3ee', position: { top: '20%', left: '8%' }, animation: 'animate-aurora-2', size: '260px', opacity: 0.3 },
    ],
    floats: [
      { emoji: '🐉', position: { top: '8%', left: '4%' }, animation: 'animate-float-1', size: '2rem' },
      { emoji: '⭐', position: { top: '22%', right: '5%' }, animation: 'animate-float-2', size: '1.5rem' },
      { emoji: '☁️', position: { top: '52%', left: '3%' }, animation: 'animate-float-3', size: '1.8rem' },
      { emoji: '✨', position: { bottom: '28%', right: '5%' }, animation: 'animate-float-1', size: '1.4rem' },
      { emoji: '💎', position: { bottom: '14%', left: '7%' }, animation: 'animate-float-2', size: '1.5rem' },
      { emoji: '🌈', position: { top: '70%', right: '20%' }, animation: 'animate-float-3', size: '1.6rem' },
    ],
  },

  storst: {
    gradient: 'linear-gradient(160deg, #000518 0%, #000f38 18%, #001a5a 35%, #0f0a40 58%, #000518 100%)',
    orbs: [
      { color: '#6366f1', position: { top: '-10%', right: '-8%' }, animation: 'animate-aurora-1', size: '440px', opacity: 0.35 },
      { color: '#06b6d4', position: { bottom: '8%', left: '-10%' }, animation: 'animate-aurora-2', size: '360px', opacity: 0.28 },
      { color: '#3b82f6', position: { top: '40%', right: '18%' }, animation: 'animate-aurora-3', size: '300px', opacity: 0.22 },
      { color: '#8b5cf6', position: { top: '22%', left: '10%' }, animation: 'animate-aurora-2', size: '240px', opacity: 0.18 },
    ],
    floats: [
      { emoji: '⚡', position: { top: '8%', left: '4%' }, animation: 'animate-float-1', size: '1.8rem' },
      { emoji: '🔮', position: { top: '22%', right: '6%' }, animation: 'animate-float-2', size: '1.5rem' },
      { emoji: '✨', position: { top: '55%', left: '3%' }, animation: 'animate-float-3', size: '1.3rem' },
      { emoji: '⭐', position: { bottom: '28%', right: '5%' }, animation: 'animate-float-1', size: '1.4rem' },
      { emoji: '🌌', position: { bottom: '14%', left: '8%' }, animation: 'animate-float-2', size: '1.5rem' },
    ],
  },
};
