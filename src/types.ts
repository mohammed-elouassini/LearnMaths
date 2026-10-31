export interface Deck {
  id: string;
  name: string;
  description: string;
}

export interface Chapter {
  id: string;
  deckId: string;
  name: string;
  description: string;
}

export interface Card {
  id: string;
  chapterId: string;
  front: string;
  back: string;
  level: number;
  dueOn: string;
  reviewCount: number;
  lastActivityAt: number;
  masteredAt: number | null;
}

export interface ReviewSettings {
  intervals: number[];
  reminderHour: number;
  avatarDataUrl: string | null;
}

export interface LearnData {
  decks: Deck[];
  chapters: Chapter[];
  cards: Card[];
  settings: ReviewSettings;
}

export type Route =
  | { name: 'home' }
  | { name: 'decks' }
  | { name: 'deck'; deckId: string }
  | { name: 'chapter'; chapterId: string }
  | { name: 'cards' }
  | { name: 'review'; chapterIds?: string[] }
  | { name: 'settings' };

export type Navigate = (route: Route) => void;
