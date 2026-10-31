import { useState } from 'react';
import { ArrowLeft, BookOpen, FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { NamedItemFormModal } from '@/components/NamedItemFormModal';
import { summarizeCards, todayKey } from '@/lib/scheduling';
import { getChapterCards, getDeckCards, getDeckChapters } from '@/lib/selectors';
import { buttonPrimary, buttonSecondary, panelClass } from '@/lib/styles';
import type { LearnStore } from '@/hooks/useLearnData';
import type { Navigate } from '@/types';

type Dialog = { kind: 'edit' } | { kind: 'delete' } | { kind: 'createChapter' };

interface SubjectPageProps {
  deckId: string;
  store: LearnStore;
  navigate: Navigate;
}

export function SubjectPage({ deckId, store, navigate }: SubjectPageProps) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const deck = store.decks.find((item) => item.id === deckId);

  if (!deck) {
    return (
      <div className={`${panelClass} space-y-4 p-8 text-center`}>
        <p className="font-semibold">Cette matière n'existe plus.</p>
        <button type="button" onClick={() => navigate({ name: 'decks' })} className={buttonSecondary}>
          Retour à mes connaissances
        </button>
      </div>
    );
  }

  const chapters = getDeckChapters(store, deck.id);
  const cards = getDeckCards(store, deck.id);
  const today = todayKey();
  const stats = summarizeCards(cards, today);
  const close = () => setDialog(null);

  return (
    <div className="space-y-8">
      <div>
        <button
          type="button"
          onClick={() => navigate({ name: 'decks' })}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Mes connaissances
        </button>
      </div>

      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{deck.name}</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">{deck.description || 'Aucune description'}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {chapters.length} chapitre{chapters.length > 1 ? 's' : ''} · {stats.total} carte
            {stats.total > 1 ? 's' : ''} · {stats.due} à réviser
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate({ name: 'review', chapterIds: chapters.map((chapter) => chapter.id) })}
            disabled={stats.due === 0}
            className={buttonPrimary}
          >
            <BookOpen className="h-4 w-4" />
            Réviser cette matière
          </button>
          <button type="button" onClick={() => setDialog({ kind: 'edit' })} className={buttonSecondary}>
            <Pencil className="h-4 w-4" />
            Modifier
          </button>
          <button type="button" onClick={() => setDialog({ kind: 'delete' })} className={buttonSecondary}>
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Chapitres</h2>
          <button type="button" onClick={() => setDialog({ kind: 'createChapter' })} className={buttonPrimary}>
            <Plus className="h-4 w-4" />
            Ajouter un chapitre
          </button>
        </div>

        {chapters.length === 0 ? (
          <div className={`${panelClass} px-6 py-14 text-center`}>
            <p className="font-semibold">Cette matière ne contient encore aucun chapitre.</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Créez un chapitre pour y ranger vos cartes.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {chapters.map((chapter) => {
              const chapterCards = getChapterCards(store, chapter.id);
              const chapterStats = summarizeCards(chapterCards, today);
              const progress =
                chapterStats.total > 0 ? Math.round((chapterStats.mastered / chapterStats.total) * 100) : 0;
              return (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => navigate({ name: 'chapter', chapterId: chapter.id })}
                  className={`${panelClass} group flex flex-col gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md active:scale-[0.99] dark:hover:border-brand-700`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300">
                        <FolderOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-semibold">{chapter.name}</p>
                        <p className="line-clamp-2 text-sm text-stone-500 dark:text-stone-400">
                          {chapter.description || `${chapterCards.length} carte${chapterCards.length > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                    {chapterStats.due > 0 && (
                      <span className="shrink-0 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">
                        {chapterStats.due} à réviser
                      </span>
                    )}
                  </div>
                  <div className="mt-auto space-y-2">
                    <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
                      <span>
                        {chapterCards.length} carte{chapterCards.length > 1 ? 's' : ''}
                      </span>
                      <span>{progress}% maîtrisé</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-500 group-hover:bg-brand-400"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {dialog?.kind === 'edit' && (
        <NamedItemFormModal
          title="Modifier la matière"
          namePlaceholder="Ex. Probabilités"
          initial={deck}
          onClose={close}
          onSave={async (name, description) => {
            const ok = await store.updateDeck(deck.id, name, description);
            if (ok) close();
          }}
        />
      )}

      {dialog?.kind === 'createChapter' && (
        <NamedItemFormModal
          title="Nouveau chapitre"
          namePlaceholder="Ex. Variables aléatoires"
          onClose={close}
          onSave={async (name, description) => {
            const id = await store.addChapter(deck.id, name, description);
            if (!id) return;
            close();
            navigate({ name: 'chapter', chapterId: id });
          }}
        />
      )}

      {dialog?.kind === 'delete' && (
        <ConfirmModal
          title="Supprimer la matière"
          message={`La matière « ${deck.name} », ses ${chapters.length} chapitre(s) et leurs ${cards.length} carte(s) seront supprimés définitivement.`}
          confirmLabel="Supprimer"
          onClose={close}
          onConfirm={async () => {
            const ok = await store.deleteDeck(deck.id);
            if (ok) navigate({ name: 'decks' });
          }}
        />
      )}
    </div>
  );
}
