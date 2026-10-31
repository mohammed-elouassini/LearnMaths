import { useState } from 'react';
import { BookOpen, Layers } from 'lucide-react';
import { buttonPrimary, buttonSecondary, panelClass } from '@/lib/styles';
import { summarizeCards, todayKey } from '@/lib/scheduling';
import { getChapterCards, getDeckChapters } from '@/lib/selectors';
import type { LearnStore } from '@/hooks/useLearnData';
import type { Navigate } from '@/types';

interface ReviewSelectPageProps {
  store: LearnStore;
  navigate: Navigate;
}

export function ReviewSelectPage({ store, navigate }: ReviewSelectPageProps) {
  const today = todayKey();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const subjects = store.decks.map((deck) => ({
    deck,
    chapters: getDeckChapters(store, deck.id).map((chapter) => ({
      chapter,
      due: summarizeCards(getChapterCards(store, chapter.id), today).due,
    })),
  }));
  const dueByChapter = new Map(subjects.flatMap(({ chapters }) => chapters.map(({ chapter, due }) => [chapter.id, due])));
  const totalDue = [...dueByChapter.values()].reduce((sum, due) => sum + due, 0);
  const selectedDue = [...selected].reduce((sum, id) => sum + (dueByChapter.get(id) ?? 0), 0);

  const toggle = (ids: string[]) => {
    setSelected((current) => {
      const next = new Set(current);
      const allSelected = ids.every((id) => next.has(id));
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const dueIdsOf = (chapterIds: string[]) => chapterIds.filter((id) => (dueByChapter.get(id) ?? 0) > 0);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Aujourd'hui</p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Réviser</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {totalDue} carte{totalDue > 1 ? 's' : ''} à réviser. Choisissez les chapitres à travailler.
        </p>
      </header>

      {totalDue === 0 ? (
        <div className={`${panelClass} flex flex-col items-center gap-4 px-6 py-16 text-center`}>
          <p className="text-lg font-semibold">Rien à réviser aujourd'hui</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">Vos prochains devoirs apparaîtront ici le jour venu.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate({ name: 'review', chapterIds: dueIdsOf([...dueByChapter.keys()]) })}
              className={buttonSecondary}
            >
              Tout réviser
            </button>
          </div>

          {subjects
            .filter(({ chapters }) => chapters.some(({ due }) => due > 0))
            .map(({ deck, chapters }) => {
              const dueIds = dueIdsOf(chapters.map(({ chapter }) => chapter.id));
              return (
                <section key={deck.id} className={`${panelClass} space-y-4 p-5 sm:p-6`}>
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <Layers className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                      {deck.name}
                    </h2>
                    <button type="button" onClick={() => toggle(dueIds)} className="text-sm font-medium text-brand-700 hover:text-brand-600 dark:text-brand-300">
                      Tout sélectionner
                    </button>
                  </div>
                  <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                    {chapters.map(({ chapter, due }) => (
                      <li key={chapter.id}>
                        <label
                          className={`flex items-center justify-between gap-4 py-3 ${due === 0 ? 'opacity-50' : 'cursor-pointer'}`}
                        >
                          <span className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              disabled={due === 0}
                              checked={selected.has(chapter.id)}
                              onChange={() => toggle([chapter.id])}
                              className="h-4 w-4 accent-brand-600"
                            />
                            <span className="font-medium">{chapter.name}</span>
                          </span>
                          <span className="text-sm text-stone-500 dark:text-stone-400">{due} à réviser</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}

          <div className={`${panelClass} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {selectedDue} carte{selectedDue > 1 ? 's' : ''} sélectionnée{selectedDue > 1 ? 's' : ''}
            </p>
            <button
              type="button"
              disabled={selectedDue === 0}
              onClick={() => navigate({ name: 'review', chapterIds: [...selected] })}
              className={buttonPrimary}
            >
              <BookOpen className="h-4 w-4" />
              Commencer la révision
            </button>
          </div>
        </>
      )}
    </div>
  );
}
