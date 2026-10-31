import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, RotateCcw, Trash2, Trophy } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { MathText } from '@/components/MathText';
import { Modal } from '@/components/Modal';
import { buildDailyQueue, getCardCategory, CARD_CATEGORIES, LEVEL_COUNT, todayKey } from '@/lib/scheduling';
import { getChaptersCards } from '@/lib/selectors';
import { buttonPrimary, buttonSecondary, panelClass } from '@/lib/styles';
import type { LearnStore } from '@/hooks/useLearnData';
import type { Card, Navigate } from '@/types';

interface ReviewPageProps {
  chapterIds: string[];
  store: LearnStore;
  navigate: Navigate;
}

const dayLabel = (days: number) => `${days} jour${days > 1 ? 's' : ''}`;

const formatOrdinal = (value: number) => `${value}${value === 1 ? 're' : 'e'}`;

export function ReviewPage({ chapterIds, store, navigate }: ReviewPageProps) {
  const chapters = store.chapters.filter((chapter) => chapterIds.includes(chapter.id));

  const [queue] = useState<string[]>(() =>
    buildDailyQueue(getChaptersCards(store, chapterIds), todayKey()).map((card) => card.id),
  );
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [celebration, setCelebration] = useState<number | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);

  const cardsById = useMemo(() => new Map(store.cards.map((card) => [card.id, card])), [store.cards]);
  const current = index < queue.length ? cardsById.get(queue[index]) : undefined;

  useEffect(() => {
    if (!current || revealed) return;
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;
      if (event.code === 'Space' || event.key === 'Enter') {
        event.preventDefault();
        setRevealed(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current, revealed]);

  if (chapters.length === 0) {
    return (
      <div className={`${panelClass} space-y-4 p-8 text-center`}>
        <p className="font-semibold">Cet élément n'existe plus.</p>
        <button type="button" onClick={() => navigate({ name: 'home' })} className={buttonSecondary}>
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const subtitle = chapters.length === 1 ? chapters[0]?.name : `${chapters.length} chapitres sélectionnés`;
  const backLabel = 'Retour à la sélection';
  const goBack = () => navigate({ name: 'review' });

  const advance = () => {
    setIndex((value) => value + 1);
    setRevealed(false);
    setReviewedCount((value) => value + 1);
  };

  const validate = async (card: Card) => {
    setBusy(true);
    const result = await store.validateCard(card);
    setBusy(false);
    if (!result) return;
    if (result.justMastered) setCelebration(result.masteredCount);
    advance();
  };

  const postpone = async (card: Card, level: number) => {
    setBusy(true);
    const ok = await store.postponeCard(card, level);
    setBusy(false);
    if (ok) advance();
  };

  const remove = async (card: Card) => {
    setBusy(true);
    const ok = await store.deleteCard(card.id);
    setBusy(false);
    setConfirmDelete(false);
    if (ok) advance();
  };

  const header = (
    <div className="space-y-4">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </button>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">{subtitle}</p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Réviser</h1>
        </div>
        {queue.length > 0 && (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {Math.min(reviewedCount, queue.length)} / {queue.length} traitée{queue.length > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );

  const finished = queue.length === 0 || !current;

  return (
    <div className="space-y-8">
      {header}

      {finished ? (
        <div className={`${panelClass} flex flex-col items-center gap-4 px-6 py-16 text-center`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300">
            <Trophy className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold">
              {queue.length === 0 ? "Rien à réviser aujourd'hui" : 'Séance terminée'}
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {queue.length === 0
                ? 'Vos prochains devoirs apparaîtront ici le jour venu.'
                : 'Bravo pour cette séance. Revenez demain pour la suite.'}
            </p>
          </div>
          <button type="button" onClick={goBack} className={buttonPrimary}>
            {backLabel}
          </button>
        </div>
      ) : (
        <ReviewCard
          card={current}
          intervals={store.settings.intervals}
          revealed={revealed}
          busy={busy}
          onReveal={() => setRevealed(true)}
          onDelete={() => setConfirmDelete(true)}
          onPostpone={(level) => void postpone(current, level)}
          onValidate={() => void validate(current)}
        />
      )}

      {confirmDelete && current && (
        <ConfirmModal
          title="Supprimer la carte"
          message="Cette carte et son historique de révision seront supprimés définitivement."
          confirmLabel="Supprimer"
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => void remove(current)}
        />
      )}

      {celebration !== null && (
        <Modal title="Bravo !" onClose={() => setCelebration(null)}>
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
              <Trophy className="h-7 w-7" />
            </div>
            <p className="text-base leading-relaxed text-stone-700 dark:text-stone-200">
              Bravo, nouvelle notion acquise !! Il s'agit de la {formatOrdinal(celebration)} !
            </p>
            <button type="button" onClick={() => setCelebration(null)} className={buttonPrimary}>
              Continuer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

interface ReviewCardProps {
  card: Card;
  intervals: number[];
  revealed: boolean;
  busy: boolean;
  onReveal: () => void;
  onDelete: () => void;
  onPostpone: (level: number) => void;
  onValidate: () => void;
}

function ReviewCard({ card, intervals, revealed, busy, onReveal, onDelete, onPostpone, onValidate }: ReviewCardProps) {
  const category = CARD_CATEGORIES.find((item) => item.key === getCardCategory(card));
  const lowerLevels = Array.from({ length: card.level - 1 }, (_, i) => i + 1);
  const isLastLevel = card.level >= LEVEL_COUNT;
  const validateLabel = isLastLevel
    ? 'Valider définitivement'
    : `Valider · revoir dans ${dayLabel(intervals[card.level])}`;

  return (
    <article className={`${panelClass} space-y-6 p-6 sm:p-8`}>
      <div className="flex items-center justify-between gap-4">
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          {category?.label}
        </span>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          Niveau {card.level} sur {LEVEL_COUNT}
        </span>
      </div>

      <div className="min-h-24 text-lg leading-relaxed text-stone-900 dark:text-stone-100">
        <MathText text={card.front} />
      </div>

      {!revealed ? (
        <button type="button" onClick={onReveal} className={`${buttonPrimary} w-full`}>
          <Eye className="h-4 w-4" />
          Afficher la réponse
        </button>
      ) : (
        <div className="space-y-6">
          <div className="border-t border-stone-100 pt-6 text-lg leading-relaxed text-stone-900 dark:border-stone-800 dark:text-stone-100">
            <MathText text={card.back} />
          </div>

          <div className="space-y-3">
            {lowerLevels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {lowerLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    disabled={busy}
                    onClick={() => onPostpone(level)}
                    className={buttonSecondary}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Revoir dans {dayLabel(intervals[level - 1])}
                  </button>
                ))}
              </div>
            )}
            <button type="button" disabled={busy} onClick={onValidate} className={`${buttonPrimary} w-full`}>
              {validateLabel}
            </button>
            <div className="flex justify-center">
              <button
                type="button"
                disabled={busy}
                onClick={onDelete}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer la carte
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
