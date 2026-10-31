import { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { NamedItemFormModal } from '@/components/NamedItemFormModal';
import { summarizeCards, todayKey } from '@/lib/scheduling';
import { getDeckCards, getDeckChapters } from '@/lib/selectors';
import { buttonPrimary, panelClass } from '@/lib/styles';
import type { LearnStore } from '@/hooks/useLearnData';
import type { Navigate } from '@/types';

interface KnowledgePageProps {
  store: LearnStore;
  navigate: Navigate;
}

export function KnowledgePage({ store, navigate }: KnowledgePageProps) {
  const [creating, setCreating] = useState(false);
  const today = todayKey();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Vos matières</p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Mes connaissances</h1>
        </div>
        <button type="button" onClick={() => setCreating(true)} className={buttonPrimary}>
          <Plus className="h-4 w-4" />
          Nouvelle matière
        </button>
      </header>

      {store.decks.length === 0 ? (
        <div className={`${panelClass} flex flex-col items-center gap-4 px-6 py-16 text-center`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300">
            <Layers className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold">Aucune matière pour le moment</p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Créez une matière, puis ajoutez-y des chapitres et leurs cartes.
            </p>
          </div>
          <button type="button" onClick={() => setCreating(true)} className={buttonPrimary}>
            <Plus className="h-4 w-4" />
            Créer ma première matière
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {store.decks.map((deck) => {
            const cards = getDeckCards(store, deck.id);
            const chapterCount = getDeckChapters(store, deck.id).length;
            const stats = summarizeCards(cards, today);
            const progress = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
            return (
              <button
                key={deck.id}
                type="button"
                onClick={() => navigate({ name: 'deck', deckId: deck.id })}
                className={`${panelClass} group flex flex-col gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md active:scale-[0.99] dark:hover:border-brand-700`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-base font-semibold">{deck.name}</p>
                    <p className="line-clamp-2 text-sm text-stone-500 dark:text-stone-400">
                      {deck.description || 'Aucune description'}
                    </p>
                  </div>
                  {stats.due > 0 && (
                    <span className="shrink-0 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">
                      {stats.due} à réviser
                    </span>
                  )}
                </div>
                <div className="mt-auto space-y-2">
                  <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
                    <span>
                      {chapterCount} chapitre{chapterCount > 1 ? 's' : ''} · {stats.total} carte
                      {stats.total > 1 ? 's' : ''}
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

      {creating && (
        <NamedItemFormModal
          title="Nouvelle matière"
          namePlaceholder="Ex. Probabilités"
          onClose={() => setCreating(false)}
          onSave={async (name, description) => {
            const id = await store.addDeck(name, description);
            if (!id) return;
            setCreating(false);
            navigate({ name: 'deck', deckId: id });
          }}
        />
      )}
    </div>
  );
}
