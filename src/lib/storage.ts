import type { Chapter, Deck } from '@/types';

const STORAGE_KEY = 'learnmaths:data:v2';

export interface LegacyLibrary {
  decks: Deck[];
  chapters: Chapter[];
  cards: { id: string; chapterId: string; front: string; back: string; reviews: number; createdAt: number }[];
}

function readJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readLegacyLibrary(): LegacyLibrary | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  const data = readJson(raw) as Partial<LegacyLibrary> | null;
  if (!data || !Array.isArray(data.decks) || !Array.isArray(data.chapters) || !Array.isArray(data.cards)) {
    return null;
  }
  return { decks: data.decks, chapters: data.chapters, cards: data.cards };
}

export function clearLegacyLibrary() {
  localStorage.removeItem(STORAGE_KEY);
}
