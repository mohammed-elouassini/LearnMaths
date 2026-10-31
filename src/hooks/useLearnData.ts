import { useCallback, useEffect, useState } from 'react';
import {
  deleteCard as dbDeleteCard,
  deleteChapter as dbDeleteChapter,
  deleteDeck as dbDeleteDeck,
  fetchLibrary,
  importLegacyLibrary,
  insertCard,
  insertChapter,
  insertDeck,
  updateCardContent,
  updateCardSchedule,
  updateChapter as dbUpdateChapter,
  updateDeck as dbUpdateDeck,
  updateReviewSettings,
} from '@/lib/database';
import {
  createCardSchedule,
  postponeCardSchedule,
  validateCardSchedule,
} from '@/lib/scheduling';
import { clearLegacyLibrary, readLegacyLibrary } from '@/lib/storage';
import type { Card, LearnData, ReviewSettings } from '@/types';

export interface ValidationResult {
  justMastered: boolean;
  masteredCount: number;
}

export interface LearnActions {
  addDeck(name: string, description: string): Promise<string | null>;
  updateDeck(id: string, name: string, description: string): Promise<boolean>;
  deleteDeck(id: string): Promise<boolean>;
  addChapter(deckId: string, name: string, description: string): Promise<string | null>;
  updateChapter(id: string, name: string, description: string): Promise<boolean>;
  deleteChapter(id: string): Promise<boolean>;
  addCard(chapterId: string, front: string, back: string): Promise<boolean>;
  updateCard(id: string, front: string, back: string): Promise<boolean>;
  deleteCard(id: string): Promise<boolean>;
  validateCard(card: Card): Promise<ValidationResult | null>;
  postponeCard(card: Card, level: number): Promise<boolean>;
  updateSettings(settings: ReviewSettings): Promise<boolean>;
}

export type LearnStore = LearnData & LearnActions;

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Une erreur inattendue est survenue.';
}

export function useLearnData() {
  const [data, setData] = useState<LearnData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const legacy = readLegacyLibrary();
      let library = await fetchLibrary();
      if (legacy) {
        if (library.decks.length === 0) await importLegacyLibrary(legacy);
        clearLegacyLibrary();
        library = await fetchLibrary();
      }
      setData(library);
    } catch (error) {
      setLoadError(describeError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(async <T,>(task: () => Promise<T>): Promise<T | null> => {
    try {
      setActionError(null);
      return await task();
    } catch (error) {
      setActionError(describeError(error));
      return null;
    }
  }, []);

  const update = useCallback(
    (change: (library: LearnData) => LearnData) => setData((current) => (current ? change(current) : current)),
    [],
  );

  const replaceCard = useCallback(
    (id: string, patch: Partial<Card>) =>
      update((library) => ({
        ...library,
        cards: library.cards.map((card) => (card.id === id ? { ...card, ...patch } : card)),
      })),
    [update],
  );

  const addDeck = useCallback(
    (name: string, description: string) =>
      run(async () => {
        const deck = await insertDeck(name, description);
        update((library) => ({ ...library, decks: [...library.decks, deck] }));
        return deck.id;
      }),
    [run, update],
  );

  const updateDeck = useCallback(
    (id: string, name: string, description: string) =>
      run(async () => {
        await dbUpdateDeck(id, name, description);
        update((library) => ({
          ...library,
          decks: library.decks.map((deck) => (deck.id === id ? { ...deck, name, description } : deck)),
        }));
        return true;
      }).then((result) => result === true),
    [run, update],
  );

  const deleteDeck = useCallback(
    (id: string) =>
      run(async () => {
        await dbDeleteDeck(id);
        update((library) => {
          const chapterIds = new Set(library.chapters.filter((chapter) => chapter.deckId === id).map((c) => c.id));
          return {
            ...library,
            decks: library.decks.filter((deck) => deck.id !== id),
            chapters: library.chapters.filter((chapter) => chapter.deckId !== id),
            cards: library.cards.filter((card) => !chapterIds.has(card.chapterId)),
          };
        });
        return true;
      }).then((result) => result === true),
    [run, update],
  );

  const addChapter = useCallback(
    (deckId: string, name: string, description: string) =>
      run(async () => {
        const chapter = await insertChapter(deckId, name, description);
        update((library) => ({ ...library, chapters: [...library.chapters, chapter] }));
        return chapter.id;
      }),
    [run, update],
  );

  const updateChapter = useCallback(
    (id: string, name: string, description: string) =>
      run(async () => {
        await dbUpdateChapter(id, name, description);
        update((library) => ({
          ...library,
          chapters: library.chapters.map((chapter) =>
            chapter.id === id ? { ...chapter, name, description } : chapter,
          ),
        }));
        return true;
      }).then((result) => result === true),
    [run, update],
  );

  const deleteChapter = useCallback(
    (id: string) =>
      run(async () => {
        await dbDeleteChapter(id);
        update((library) => ({
          ...library,
          chapters: library.chapters.filter((chapter) => chapter.id !== id),
          cards: library.cards.filter((card) => card.chapterId !== id),
        }));
        return true;
      }).then((result) => result === true),
    [run, update],
  );

  const addCard = useCallback(
    (chapterId: string, front: string, back: string) =>
      run(async () => {
        if (!data) throw new Error('Les données ne sont pas encore chargées.');
        const card = await insertCard(
          chapterId,
          front,
          back,
          createCardSchedule(data.settings.intervals),
        );
        update((library) => ({ ...library, cards: [...library.cards, card] }));
        return true;
      }).then((result) => result === true),
    [run, update, data],
  );

  const updateCard = useCallback(
    (id: string, front: string, back: string) =>
      run(async () => {
        await updateCardContent(id, front, back);
        replaceCard(id, { front, back });
        return true;
      }).then((result) => result === true),
    [run, replaceCard],
  );

  const deleteCard = useCallback(
    (id: string) =>
      run(async () => {
        await dbDeleteCard(id);
        update((library) => ({ ...library, cards: library.cards.filter((card) => card.id !== id) }));
        return true;
      }).then((result) => result === true),
    [run, update],
  );

  const validateCard = useCallback(
    (card: Card) =>
      run(async () => {
        if (!data) throw new Error('Les données ne sont pas encore chargées.');
        const schedule = validateCardSchedule(card, data.settings.intervals);
        await updateCardSchedule(card.id, schedule);
        replaceCard(card.id, schedule);
        const justMastered = schedule.masteredAt !== null;
        const alreadyMastered = data.cards.filter((item) => item.masteredAt !== null).length;
        return { justMastered, masteredCount: alreadyMastered + (justMastered ? 1 : 0) };
      }),
    [run, replaceCard, data],
  );

  const postponeCard = useCallback(
    (card: Card, level: number) =>
      run(async () => {
        if (!data) throw new Error('Les données ne sont pas encore chargées.');
        const schedule = postponeCardSchedule(card, level, data.settings.intervals);
        await updateCardSchedule(card.id, schedule);
        replaceCard(card.id, schedule);
        return true;
      }).then((result) => result === true),
    [run, replaceCard, data],
  );

  const updateSettings = useCallback(
    (settings: ReviewSettings) =>
      run(async () => {
        await updateReviewSettings(settings);
        update((library) => ({ ...library, settings }));
        return true;
      }).then((result) => result === true),
    [run, update],
  );

  const store: LearnStore | null = data
    ? {
        ...data,
        addDeck,
        updateDeck,
        deleteDeck,
        addChapter,
        updateChapter,
        deleteChapter,
        addCard,
        updateCard,
        deleteCard,
        validateCard,
        postponeCard,
        updateSettings,
      }
    : null;

  return {
    store,
    loading,
    loadError,
    actionError,
    retryLoad: load,
    dismissActionError: () => setActionError(null),
  };
}
