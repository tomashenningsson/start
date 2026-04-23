export interface WordData {
  word: string;
  emoji: string;
  hint: string;
  level: 1 | 2 | 3;
}

export const wordList: WordData[] = [
  // Level 1 — 3 letters
  { word: 'APA', emoji: '🐒', hint: 'apa', level: 1 },
  { word: 'BIL', emoji: '🚗', hint: 'bil', level: 1 },
  { word: 'DAG', emoji: '☀️', hint: 'dag', level: 1 },
  { word: 'HUS', emoji: '🏠', hint: 'hus', level: 1 },
  { word: 'MUS', emoji: '🐭', hint: 'mus', level: 1 },
  { word: 'SOL', emoji: '🌞', hint: 'sol', level: 1 },
  { word: 'BOK', emoji: '📚', hint: 'bok', level: 1 },
  { word: 'ELD', emoji: '🔥', hint: 'eld', level: 1 },
  { word: 'RÄV', emoji: '🦊', hint: 'räv', level: 1 },
  { word: 'ORM', emoji: '🐍', hint: 'orm', level: 1 },
  // Level 2 — 4–5 letters
  { word: 'FISK', emoji: '🐟', hint: 'fisk', level: 2 },
  { word: 'HÄST', emoji: '🐴', hint: 'häst', level: 2 },
  { word: 'KATT', emoji: '🐱', hint: 'katt', level: 2 },
  { word: 'HUND', emoji: '🐶', hint: 'hund', level: 2 },
  { word: 'BOLL', emoji: '⚽', hint: 'boll', level: 2 },
  { word: 'ÄPPLE', emoji: '🍎', hint: 'äpple', level: 2 },
  { word: 'TIGER', emoji: '🐯', hint: 'tiger', level: 2 },
  { word: 'LEJON', emoji: '🦁', hint: 'lejon', level: 2 },
  // Level 3 — 5+ letters
  { word: 'BJÖRN', emoji: '🐻', hint: 'björn', level: 3 },
  { word: 'ELEFANT', emoji: '🐘', hint: 'elefant', level: 3 },
  { word: 'GIRAFF', emoji: '🦒', hint: 'giraff', level: 3 },
  { word: 'PINGVIN', emoji: '🐧', hint: 'pingvin', level: 3 },
  { word: 'IGELKOTT', emoji: '🦔', hint: 'igelkott', level: 3 },
];
