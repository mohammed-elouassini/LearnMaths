import type { LearnData } from '@/types';

export function getDeckChapters(data: Pick<LearnData, 'chapters'>, deckId: string) {
  return data.chapters.filter((chapter) => chapter.deckId === deckId);
}

export function getChapterCards(data: Pick<LearnData, 'cards'>, chapterId: string) {
  return data.cards.filter((card) => card.chapterId === chapterId);
}

export function getDeckCards(data: LearnData, deckId: string) {
  const chapterIds = new Set(getDeckChapters(data, deckId).map((chapter) => chapter.id));
  return data.cards.filter((card) => chapterIds.has(card.chapterId));
}

export function getChaptersCards(data: Pick<LearnData, 'cards'>, chapterIds: string[]) {
  const selected = new Set(chapterIds);
  return data.cards.filter((card) => selected.has(card.chapterId));
}
