import type { Card, ReviewSettings } from '@/types';

export const LEVEL_COUNT = 5;
export const MAX_INTERVAL_DAYS = 100;
export const DEFAULT_SETTINGS: ReviewSettings = { intervals: [1, 3, 7, 15, 30], reminderHour: 18, avatarDataUrl: null };

export const CARD_CATEGORIES = [
  { key: 'etudiees', label: 'Étudiées' },
  { key: 'vues', label: 'Vues' },
  { key: 'revues', label: 'Revues' },
  { key: 'revisees', label: 'Révisées' },
  { key: 'travaillees', label: 'Travaillées' },
  { key: 'maitrisees', label: 'Maîtrisées' },
] as const;

export type CardCategory = (typeof CARD_CATEGORIES)[number]['key'];

const CATEGORY_BY_LEVEL: CardCategory[] = ['etudiees', 'vues', 'revues', 'revisees', 'travaillees'];

export function getCardCategory(card: Pick<Card, 'level' | 'masteredAt'>): CardCategory {
  return card.masteredAt !== null ? 'maitrisees' : CATEGORY_BY_LEVEL[card.level - 1];
}

const pad = (value: number) => String(value).padStart(2, '0');

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return toDateKey(new Date(year, month - 1, day + days));
}

export function isDue(card: Card, today: string): boolean {
  return card.masteredAt === null && card.dueOn <= today;
}

export function buildDailyQueue(cards: Card[], today: string): Card[] {
  const due = cards.filter((card) => isDue(card, today));
  for (let index = due.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [due[index], due[other]] = [due[other], due[index]];
  }
  return due;
}

export function summarizeCards(cards: Card[], today: string = todayKey()) {
  let due = 0;
  let mastered = 0;
  for (const card of cards) {
    if (isDue(card, today)) due += 1;
    if (card.masteredAt !== null) mastered += 1;
  }
  return { total: cards.length, due, mastered };
}

export function formatDueLabel(card: Card, today: string): string {
  if (card.masteredAt !== null) return 'Validée';
  if (card.dueOn < today) return 'En retard';
  if (card.dueOn === today) return "Aujourd'hui";
  if (card.dueOn === addDays(today, 1)) return 'Demain';
  const [year, month, day] = card.dueOn.split('-').map(Number);
  return `Le ${new Date(year, month - 1, day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
}

export function validateIntervals(values: number[]): string | null {
  if (values.length !== LEVEL_COUNT || values.some((value) => !Number.isInteger(value) || value < 1 || value > MAX_INTERVAL_DAYS)) {
    return `Chaque durée doit être un nombre entier de jours entre 1 et ${MAX_INTERVAL_DAYS}.`;
  }
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] <= values[index - 1]) {
      return 'Les durées doivent être strictement croissantes : chaque durée doit être plus longue que la précédente.';
    }
  }
  return null;
}

export type CardSchedule = Pick<Card, 'level' | 'dueOn' | 'reviewCount' | 'lastActivityAt' | 'masteredAt'>;

export function createCardSchedule(intervals: number[], now: Date = new Date()): CardSchedule {
  return {
    level: 1,
    dueOn: addDays(toDateKey(now), intervals[0]),
    reviewCount: 0,
    lastActivityAt: now.getTime(),
    masteredAt: null,
  };
}

export function validateCardSchedule(card: Card, intervals: number[], now: Date = new Date()): CardSchedule {
  const reviewed = { reviewCount: card.reviewCount + 1, lastActivityAt: now.getTime() };
  if (card.level >= LEVEL_COUNT) {
    return { ...reviewed, level: card.level, dueOn: card.dueOn, masteredAt: now.getTime() };
  }
  const level = card.level + 1;
  return {
    ...reviewed,
    level,
    dueOn: addDays(toDateKey(now), intervals[level - 1]),
    masteredAt: null,
  };
}

export function postponeCardSchedule(
  card: Card,
  level: number,
  intervals: number[],
  now: Date = new Date(),
): CardSchedule {
  return {
    reviewCount: card.reviewCount + 1,
    lastActivityAt: now.getTime(),
    level,
    dueOn: addDays(toDateKey(now), intervals[level - 1]),
    masteredAt: null,
  };
}
