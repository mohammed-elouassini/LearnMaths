import { useState } from 'react';
import { ArrowRight, Bell, CalendarCheck, Layers, Trophy } from 'lucide-react';
import { ReminderModal } from '@/components/ReminderModal';
import { getQuoteOfTheDay } from '@/data/dailyQuotes';
import { getDeckCards } from '@/lib/selectors';
import { summarizeCards } from '@/lib/scheduling';
import { panelClass } from '@/lib/styles';
import type { LearnStore } from '@/hooks/useLearnData';
import type { Navigate } from '@/types';

interface HomePageProps {
  store: LearnStore;
  navigate: Navigate;
}

export function HomePage({ store, navigate }: HomePageProps) {
  const [reminderOpen, setReminderOpen] = useState(false);
  const stats = summarizeCards(store.cards);
  const recentDecks = store.decks.slice(-3).reverse();
  const intervals = store.settings.intervals.map((days) => `${days}`);
  const intervalText = `${intervals.slice(0, -1).join(', ')} et ${intervals[intervals.length - 1]}`;
  const reminderTime = `${String(store.settings.reminderHour).padStart(2, '0')} h`;

  return (
    <div className="space-y-8">
      <header>
        <blockquote className="text-xl font-semibold leading-relaxed tracking-tight sm:text-2xl lg:text-3xl">
          « {getQuoteOfTheDay()} »
        </blockquote>
      </header>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-2xl font-semibold leading-snug sm:text-3xl">
              {stats.due > 0
                ? `${stats.due} carte${stats.due > 1 ? 's' : ''} à réviser aujourd'hui.`
                : "Aucune carte à réviser aujourd'hui."}
            </p>
            <p className="text-sm text-brand-100">
              {stats.due > 0
                ? 'Quelques minutes suffisent pour consolider vos acquis.'
                : 'Revenez plus tard ou ajoutez de nouvelles cartes.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate({ name: 'review' })}
            disabled={stats.due === 0}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-800 shadow-md transition hover:bg-brand-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Commencer la révision
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarCheck} label="Cartes à réviser" value={stats.due} tone="teal" />
        <StatCard icon={Layers} label="Cartes au total" value={stats.total} tone="sky" />
        <StatCard icon={Trophy} label="Cartes maîtrisées" value={stats.mastered} tone="amber" />
      </section>

      <div className="flex flex-col gap-3 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between dark:text-stone-400">
        <p>Vos cartes reviennent après {intervalText} jours, selon vos réussites.</p>
        <button
          type="button"
          onClick={() => setReminderOpen(true)}
          className="inline-flex items-center gap-2 self-start rounded-lg px-2.5 py-1.5 font-medium text-brand-700 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
        >
          <Bell className="h-4 w-4" />
          Rappel quotidien à {reminderTime}
        </button>
      </div>

      {recentDecks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Matières récentes</h2>
            <button
              type="button"
              onClick={() => navigate({ name: 'decks' })}
              className="text-sm font-medium text-brand-600 transition hover:text-brand-500 dark:text-brand-400"
            >
              Mes connaissances
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {recentDecks.map((deck) => {
              const count = getDeckCards(store, deck.id).length;
              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => navigate({ name: 'deck', deckId: deck.id })}
                  className={`${panelClass} p-5 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md active:scale-[0.99] dark:hover:border-brand-700`}
                >
                  <p className="truncate font-semibold">{deck.name}</p>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    {count} carte{count > 1 ? 's' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

const TONES = {
  teal: 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300',
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
} as const;

interface StatCardProps {
  icon: typeof Layers;
  label: string;
  value: number;
  tone: keyof typeof TONES;
}

function StatCard({ icon: Icon, label, value, tone }: StatCardProps) {
  return (
    <div className={`${panelClass} flex items-center gap-4 p-5`}>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-stone-500 dark:text-stone-400">{label}</p>
      </div>
    </div>
  );
}
