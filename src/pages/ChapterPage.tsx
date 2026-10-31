import { useState } from 'react';
import { ArrowLeft, BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { CardFormModal } from '@/components/CardFormModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { MathText } from '@/components/MathText';
import { NamedItemFormModal } from '@/components/NamedItemFormModal';
import { CARD_CATEGORIES, formatDueLabel, getCardCategory, isDue, summarizeCards, todayKey } from '@/lib/scheduling';
import { getChapterCards } from '@/lib/selectors';
import { buttonDanger, buttonGhost, buttonPrimary, buttonSecondary, panelClass } from '@/lib/styles';
import type { LearnStore } from '@/hooks/useLearnData';
import type { Card, Navigate } from '@/types';

type Dialog =
  | { kind: 'editChapter' }
  | { kind: 'deleteChapter' }
  | { kind: 'createCard' }
  | { kind: 'editCard'; card: Card }
  | { kind: 'deleteCard'; card: Card };

interface ChapterPageProps {
  chapterId: string;
  store: LearnStore;
  navigate: Navigate;
}

export function ChapterPage({ chapterId, store, navigate }: ChapterPageProps) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const chapter = store.chapters.find((item) => item.id === chapterId);
  const deck = chapter && store.decks.find((item) => item.id === chapter.deckId);

  if (!chapter || !deck) {
    return (
      <div className={`${panelClass} space-y-4 p-8 text-center`}>
        <p className="font-semibold">Ce chapitre n'existe plus.</p>
        <button type="button" onClick={() => navigate({ name: 'decks' })} className={buttonSecondary}>
          Retour à mes connaissances
        </button>
      </div>
    );
  }

  const cards = getChapterCards(store, chapter.id);
  const today = todayKey();
  const stats = summarizeCards(cards, today);
  const close = () => setDialog(null);

  return (
    <div className="space-y-8">
      <div>
        <button
          type="button"
          onClick={() => navigate({ name: 'deck', deckId: deck.id })}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {deck.name}
        </button>
      </div>

      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">{deck.name}</p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{chapter.name}</h1>
          {chapter.description && (
            <p className="text-sm text-stone-500 dark:text-stone-400">{chapter.description}</p>
          )}
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {stats.total} carte{stats.total > 1 ? 's' : ''} · {stats.due} à réviser · {stats.mastered} maîtrisée
            {stats.mastered > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate({ name: 'review', chapterIds: [chapter.id] })}
            disabled={stats.due === 0}
            className={buttonPrimary}
          >
            <BookOpen className="h-4 w-4" />
            Réviser ce chapitre
          </button>
          <button type="button" onClick={() => setDialog({ kind: 'editChapter' })} className={buttonSecondary}>
            <Pencil className="h-4 w-4" />
            Modifier
          </button>
          <button type="button" onClick={() => setDialog({ kind: 'deleteChapter' })} className={buttonSecondary}>
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Cartes</h2>
          <button type="button" onClick={() => setDialog({ kind: 'createCard' })} className={buttonPrimary}>
            <Plus className="h-4 w-4" />
            Ajouter une carte
          </button>
        </div>

        {cards.length === 0 ? (
          <div className={`${panelClass} px-6 py-14 text-center`}>
            <p className="font-semibold">Ce chapitre ne contient encore aucune carte.</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Ajoutez une question et sa réponse, avec des formules si besoin.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {cards.map((card) => (
              <li
                key={card.id}
                className={`${panelClass} flex items-start gap-4 p-4 transition hover:border-stone-300 sm:p-5 dark:hover:border-stone-700`}
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="text-base text-stone-900 dark:text-stone-100">
                    <MathText text={card.front} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                      {CARD_CATEGORIES.find((item) => item.key === getCardCategory(card))?.label}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 font-medium ${
                        isDue(card, today)
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                          : 'text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {formatDueLabel(card, today)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: 'editCard', card })}
                    className={buttonGhost}
                    aria-label="Modifier la carte"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: 'deleteCard', card })}
                    className={buttonDanger}
                    aria-label="Supprimer la carte"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dialog?.kind === 'editChapter' && (
        <NamedItemFormModal
          title="Modifier le chapitre"
          namePlaceholder="Ex. Variables aléatoires"
          initial={chapter}
          onClose={close}
          onSave={async (name, description) => {
            const ok = await store.updateChapter(chapter.id, name, description);
            if (ok) close();
          }}
        />
      )}

      {dialog?.kind === 'deleteChapter' && (
        <ConfirmModal
          title="Supprimer le chapitre"
          message={`Le chapitre « ${chapter.name} » et ses ${cards.length} carte(s) seront supprimés définitivement.`}
          confirmLabel="Supprimer"
          onClose={close}
          onConfirm={async () => {
            const ok = await store.deleteChapter(chapter.id);
            if (ok) navigate({ name: 'deck', deckId: deck.id });
          }}
        />
      )}

      {dialog?.kind === 'createCard' && (
        <CardFormModal
          onClose={close}
          onSave={async (front, back) => {
            const ok = await store.addCard(chapter.id, front, back);
            if (ok) close();
          }}
        />
      )}

      {dialog?.kind === 'editCard' && (
        <CardFormModal
          initial={dialog.card}
          onClose={close}
          onSave={async (front, back) => {
            const ok = await store.updateCard(dialog.card.id, front, back);
            if (ok) close();
          }}
        />
      )}

      {dialog?.kind === 'deleteCard' && (
        <ConfirmModal
          title="Supprimer la carte"
          message="Cette carte et son historique de révision seront supprimés."
          confirmLabel="Supprimer"
          onClose={close}
          onConfirm={async () => {
            const ok = await store.deleteCard(dialog.card.id);
            if (ok) close();
          }}
        />
      )}
    </div>
  );
}
