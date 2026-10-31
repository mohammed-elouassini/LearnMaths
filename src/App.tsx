import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useDailyReminder } from '@/hooks/useDailyReminder';
import { useLearnData } from '@/hooks/useLearnData';
import { useTheme } from '@/hooks/useTheme';
import { summarizeCards } from '@/lib/scheduling';
import { buttonPrimary, panelClass } from '@/lib/styles';
import { ChapterPage } from '@/pages/ChapterPage';
import { AllCardsPage } from '@/pages/AllCardsPage';
import { HomePage } from '@/pages/HomePage';
import { KnowledgePage } from '@/pages/KnowledgePage';
import { ReviewPage } from '@/pages/ReviewPage';
import { ReviewSelectPage } from '@/pages/ReviewSelectPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SubjectPage } from '@/pages/SubjectPage';
import type { LearnStore } from '@/hooks/useLearnData';
import type { Route } from '@/types';

function DailyReminder({ dueCount, reminderHour }: { dueCount: number; reminderHour: number }) {
  useDailyReminder(dueCount, reminderHour);
  return null;
}

function renderRoute(route: Route, store: LearnStore, navigate: (route: Route) => void) {
  switch (route.name) {
    case 'home':
      return <HomePage store={store} navigate={navigate} />;
    case 'decks':
      return <KnowledgePage store={store} navigate={navigate} />;
    case 'deck':
      return <SubjectPage deckId={route.deckId} store={store} navigate={navigate} />;
    case 'chapter':
      return <ChapterPage chapterId={route.chapterId} store={store} navigate={navigate} />;
    case 'cards':
      return <AllCardsPage store={store} navigate={navigate} />;
    case 'review':
      return route.chapterIds ? (
        <ReviewPage chapterIds={route.chapterIds} store={store} navigate={navigate} />
      ) : (
        <ReviewSelectPage store={store} navigate={navigate} />
      );
    case 'settings':
      return <SettingsPage store={store} />;
  }
}

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      role="alert"
      className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{message}</p>
      </div>
      <button type="button" onClick={onClose} className="shrink-0 text-rose-700 hover:text-rose-900 dark:text-rose-300" aria-label="Fermer le message">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function App() {
  const { store, loading, loadError, actionError, retryLoad, dismissActionError } = useLearnData();
  const { theme, toggleTheme } = useTheme();
  const [route, setRoute] = useState<Route>({ name: 'home' });

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-50 text-sm text-stone-500 dark:bg-stone-950 dark:text-stone-400">
        Chargement de vos révisions…
      </div>
    );
  }

  if (loadError || !store) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-50 p-6 dark:bg-stone-950">
        <div className={`${panelClass} max-w-md space-y-4 p-8 text-center`}>
          <p className="font-semibold">Impossible de charger vos révisions.</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">{loadError}</p>
          <button type="button" onClick={() => void retryLoad()} className={buttonPrimary}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      route={route}
      navigate={setRoute}
      theme={theme}
      onToggleTheme={toggleTheme}
      avatarDataUrl={store.settings.avatarDataUrl}
    >
      <DailyReminder
        dueCount={summarizeCards(store.cards).due}
        reminderHour={store.settings.reminderHour}
      />
      {actionError && <ErrorBanner message={actionError} onClose={dismissActionError} />}
      {renderRoute(route, store, setRoute)}
    </AppShell>
  );
}

export default App;
