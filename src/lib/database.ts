import { supabase } from '@/lib/supabase';
import { todayKey, type CardSchedule } from '@/lib/scheduling';
import type { LegacyLibrary } from '@/lib/storage';
import type { Card, Chapter, Deck, LearnData, ReviewSettings } from '@/types';

interface DeckRow {
  id: string;
  name: string;
  description: string;
}

interface ChapterRow {
  id: string;
  deck_id: string;
  name: string;
  description: string;
}

interface CardRow {
  id: string;
  chapter_id: string;
  front: string;
  back: string;
  level: number;
  due_on: string;
  review_count: number;
  last_activity_at: string;
  mastered_at: string | null;
}

interface SettingsRow {
  intervals: number[];
  reminder_hour: number;
  avatar_data_url: string | null;
}

type Response<T> = { data: T | null; error: { message: string } | null };

function unwrap<T>(response: Response<T>): T {
  if (response.error) throw new Error(response.error.message);
  if (response.data === null) throw new Error('Réponse vide de la base de données.');
  return response.data;
}

function assertOk(response: { error: { message: string } | null }) {
  if (response.error) throw new Error(response.error.message);
}

const toDeck = (row: DeckRow): Deck => ({ id: row.id, name: row.name, description: row.description });

const toChapter = (row: ChapterRow): Chapter => ({
  id: row.id,
  deckId: row.deck_id,
  name: row.name,
  description: row.description,
});

const toCard = (row: CardRow): Card => ({
  id: row.id,
  chapterId: row.chapter_id,
  front: row.front,
  back: row.back,
  level: row.level,
  dueOn: row.due_on,
  reviewCount: row.review_count,
  lastActivityAt: Date.parse(row.last_activity_at),
  masteredAt: row.mastered_at ? Date.parse(row.mastered_at) : null,
});

function scheduleColumns(schedule: Partial<CardSchedule>) {
  const columns: Record<string, unknown> = {};
  if (schedule.level !== undefined) columns.level = schedule.level;
  if (schedule.dueOn !== undefined) columns.due_on = schedule.dueOn;
  if (schedule.reviewCount !== undefined) columns.review_count = schedule.reviewCount;
  if (schedule.lastActivityAt !== undefined) {
    columns.last_activity_at = new Date(schedule.lastActivityAt).toISOString();
  }
  if (schedule.masteredAt !== undefined) {
    columns.mastered_at = schedule.masteredAt === null ? null : new Date(schedule.masteredAt).toISOString();
  }
  return columns;
}

export async function fetchLibrary(): Promise<LearnData> {
  const decks = unwrap<DeckRow[]>(await supabase.from('decks').select('*').order('created_at'));
  const chapters = unwrap<ChapterRow[]>(await supabase.from('chapters').select('*').order('created_at'));
  const cards = unwrap<CardRow[]>(await supabase.from('cards').select('*').order('created_at'));
  const settingsRows = unwrap<SettingsRow[]>(
    await supabase.from('review_settings').select('intervals, reminder_hour, avatar_data_url').eq('id', 1),
  );
  const settingsRow = settingsRows[0];
  if (!settingsRow) throw new Error('Réglages de révision introuvables.');

  return {
    decks: decks.map(toDeck),
    chapters: chapters.map(toChapter),
    cards: cards.map(toCard),
    settings: {
      intervals: settingsRow.intervals,
      reminderHour: settingsRow.reminder_hour,
      avatarDataUrl: settingsRow.avatar_data_url,
    },
  };
}

export async function insertDeck(name: string, description: string): Promise<Deck> {
  const row = unwrap<DeckRow>(await supabase.from('decks').insert({ name, description }).select().single());
  return toDeck(row);
}

export async function updateDeck(id: string, name: string, description: string) {
  assertOk(await supabase.from('decks').update({ name, description }).eq('id', id));
}

export async function deleteDeck(id: string) {
  assertOk(await supabase.from('decks').delete().eq('id', id));
}

export async function insertChapter(deckId: string, name: string, description: string): Promise<Chapter> {
  const row = unwrap<ChapterRow>(
    await supabase.from('chapters').insert({ deck_id: deckId, name, description }).select().single(),
  );
  return toChapter(row);
}

export async function updateChapter(id: string, name: string, description: string) {
  assertOk(await supabase.from('chapters').update({ name, description }).eq('id', id));
}

export async function deleteChapter(id: string) {
  assertOk(await supabase.from('chapters').delete().eq('id', id));
}

export async function insertCard(chapterId: string, front: string, back: string, schedule: CardSchedule): Promise<Card> {
  const row = unwrap<CardRow>(
    await supabase
      .from('cards')
      .insert({ chapter_id: chapterId, front, back, ...scheduleColumns(schedule) })
      .select()
      .single(),
  );
  return toCard(row);
}

export async function updateCardContent(id: string, front: string, back: string) {
  assertOk(await supabase.from('cards').update({ front, back }).eq('id', id));
}

export async function updateCardSchedule(id: string, schedule: Partial<CardSchedule>) {
  assertOk(await supabase.from('cards').update(scheduleColumns(schedule)).eq('id', id));
}

export async function deleteCard(id: string) {
  assertOk(await supabase.from('cards').delete().eq('id', id));
}

export async function updateReviewSettings(settings: ReviewSettings) {
  assertOk(
    await supabase
      .from('review_settings')
      .update({
        intervals: settings.intervals,
        reminder_hour: settings.reminderHour,
        avatar_data_url: settings.avatarDataUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1),
  );
}

export async function importLegacyLibrary(legacy: LegacyLibrary) {
  const deckIds = new Map<string, string>();
  for (const deck of legacy.decks) {
    const row = await insertDeck(deck.name, deck.description);
    deckIds.set(deck.id, row.id);
  }

  const chapterIds = new Map<string, string>();
  for (const chapter of legacy.chapters) {
    const deckId = deckIds.get(chapter.deckId);
    if (!deckId) continue;
    const row = await insertChapter(deckId, chapter.name, chapter.description);
    chapterIds.set(chapter.id, row.id);
  }

  const today = todayKey();
  const rows = legacy.cards
    .filter((card) => chapterIds.has(card.chapterId))
    .map((card) => ({
      chapter_id: chapterIds.get(card.chapterId),
      front: card.front,
      back: card.back,
      level: 1,
      due_on: today,
      review_count: card.reviews,
      last_activity_at: new Date(card.createdAt).toISOString(),
    }));
  if (rows.length > 0) assertOk(await supabase.from('cards').insert(rows));
}
