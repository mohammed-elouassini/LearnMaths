import type { ReactNode } from 'react';
import { BookOpen, Home, Layers, Moon, Settings, Sun, WalletCards } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { buttonGhost } from '@/lib/styles';
import type { Navigate, Route } from '@/types';

type Section = 'home' | 'decks' | 'cards' | 'review' | 'settings';

const NAV_ITEMS: { section: Section; label: string; shortLabel: string; icon: typeof Home; route: Route }[] = [
  { section: 'home', label: 'Accueil', shortLabel: 'Accueil', icon: Home, route: { name: 'home' } },
  { section: 'decks', label: 'Mes connaissances', shortLabel: 'Matières', icon: Layers, route: { name: 'decks' } },
  { section: 'cards', label: 'Mes cartes', shortLabel: 'Cartes', icon: WalletCards, route: { name: 'cards' } },
  { section: 'review', label: 'Réviser', shortLabel: 'Réviser', icon: BookOpen, route: { name: 'review' } },
  { section: 'settings', label: 'Paramètres', shortLabel: 'Réglages', icon: Settings, route: { name: 'settings' } },
];

export function sectionForRoute(route: Route): Section {
  if (route.name === 'deck' || route.name === 'chapter') return 'decks';
  return route.name;
}

interface AppShellProps {
  route: Route;
  navigate: Navigate;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  avatarDataUrl: string | null;
  children: ReactNode;
}

export function AppShell({ route, navigate, theme, onToggleTheme, avatarDataUrl, children }: AppShellProps) {
  const activeSection = sectionForRoute(route);
  const ThemeIcon = theme === 'dark' ? Sun : Moon;

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-stone-200 bg-white px-4 py-6 dark:border-stone-800 dark:bg-stone-900 md:flex">
        <div className="flex items-center gap-3 px-2">
          <BrandLogo avatarDataUrl={avatarDataUrl} className="h-10 w-10 rounded-xl shadow-sm" iconClassName="h-5 w-5" />
          <div>
            <p className="text-base font-semibold leading-tight">LearnMaths</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Révisions de mathématiques</p>
          </div>
        </div>

        <nav className="mt-10 space-y-1" aria-label="Navigation principale">
          {NAV_ITEMS.map(({ section, label, icon: Icon, route: target }) => {
            const active = activeSection === section;
            return (
              <button
                key={section}
                type="button"
                onClick={() => navigate(target)}
                aria-current={active ? 'page' : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition active:scale-[0.99] ${
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'
                }`}
              >
                <Icon className="h-5 w-5 transition group-hover:scale-110" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center justify-between rounded-xl border border-stone-200 px-3 py-2.5 dark:border-stone-800">
          <span className="text-sm text-stone-500 dark:text-stone-400">
            {theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
          </span>
          <button type="button" onClick={onToggleTheme} className={buttonGhost} aria-label="Changer de thème">
            <ThemeIcon className="h-5 w-5" />
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-900/90 md:hidden">
        <div className="flex items-center gap-2.5">
          <BrandLogo avatarDataUrl={avatarDataUrl} className="h-9 w-9 rounded-lg" iconClassName="h-5 w-5" />
          <span className="font-semibold">LearnMaths</span>
        </div>
        <button type="button" onClick={onToggleTheme} className={buttonGhost} aria-label="Changer de thème">
          <ThemeIcon className="h-5 w-5" />
        </button>
      </header>

      <main className="px-4 pb-28 pt-6 sm:px-6 md:ml-64 md:px-10 md:pb-12 md:pt-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>

      <nav
        aria-label="Navigation mobile"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/95 md:hidden"
      >
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map(({ section, shortLabel, icon: Icon, route: target }) => {
            const active = activeSection === section;
            return (
              <button
                key={section}
                type="button"
                onClick={() => navigate(target)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition active:scale-95 ${
                  active ? 'text-brand-600 dark:text-brand-400' : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                <Icon className={`h-5 w-5 transition ${active ? 'scale-110' : ''}`} />
                {shortLabel}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
