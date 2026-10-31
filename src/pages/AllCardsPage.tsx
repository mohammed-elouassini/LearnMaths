import { ArrowRight, Layers } from 'lucide-react';
import { MathText } from '@/components/MathText';
import { CARD_CATEGORIES, formatDueLabel, getCardCategory, todayKey, type CardCategory } from '@/lib/scheduling';
import { panelClass } from '@/lib/styles';
import type { LearnStore } from '@/hooks/useLearnData';
import type { Navigate } from '@/types';

interface AllCardsPageProps {
  store: LearnStore;
  navigate: Navigate;
}

const CATEGORY_DESCRIPTIONS: Record<CardCategory, string> = {
  etudiees: 'Niveau 1 sur 5',
  vues: 'Niveau 2 sur 5',
  revues: 'Niveau 3 sur 5',
  revisees: 'Niveau 4 sur 5',
  travaillees: 'Niveau 5 sur 5',
  maitrisees: 'Validées définitivement',
};

export function AllCardsPage({ store, navigate }: AllCardsPageProps) {
  const today = todayKey();
  const chaptersById = new Map(store.chapters.map((chapter) => [chapter.id, chapter]));
  const decksById = new Map(store.decks.map((deck) => [deck.id, deck]));

  const groups = CARD_CATEGORIES.map((category) => ({
    ...category,
    cards: store.cards
      .filter((card) => getCardCategory(card) === category.key)
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt),
  }));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Votre avancement</p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Mes cartes</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {store.cards.length} carte{store.cards.length > 1 ? 's' : ''} au total, classées selon leur niveau de
          révision.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold">
              {group.label}
              <span className="ml-2 text-sm font-medium text-stone-500 dark:text-stone-400">{group.cards.length}</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">{CATEGORY_DESCRIPTIONS[group.key]}</p>
          </div>

          {group.cards.length === 0 ? (
            <div className={`${panelClass} flex items-center gap-3 px-5 py-6 text-sm text-stone-500 dark:text-stone-400`}>
              <Layers className="h-4 w-4 shrink-0" />
              Aucune carte dans cette catégorie.
            </div>
          ) : (
            <ul className="space-y-3">
              {group.cards.map((card) => {
                const chapter = chaptersById.get(card.chapterId);
                const deck = chapter && decksById.get(chapter.deckId);
                return (
                  <li key={card.id}>
                    <button
                      type="button"
                      disabled={!chapter}
                      onClick={() => chapter && navigate({ name: 'chapter', chapterId: chapter.id })}
                      className={`${panelClass} group flex w-full items-center gap-4 p-4 text-left transition hover:border-brand-300 hover:shadow-md disabled:cursor-default disabled:hover:border-stone-200 disabled:hover:shadow-none sm:p-5 dark:hover:border-brand-700`}
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="truncate text-base text-stone-900 dark:text-stone-100">
                          <MathText text={card.front} />
                        </div>
                        <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                          {deck?.name ?? 'Matière supprimée'} · {chapter?.name ?? 'Chapitre supprimé'}
                        </p>
                      </div>
                      <span className="hidden shrink-0 text-xs font-medium text-stone-500 sm:inline dark:text-stone-400">
                        {formatDueLabel(card, today)}
                      </span>
                      {chapter && (
                        <ArrowRight className="h-4 w-4 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
