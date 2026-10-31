import { useState, type FormEvent } from 'react';
import { AlertTriangle, RotateCcw, Save } from 'lucide-react';
import { DEFAULT_SETTINGS, MAX_INTERVAL_DAYS, validateIntervals } from '@/lib/scheduling';
import { buttonPrimary, buttonSecondary, inputClass, panelClass } from '@/lib/styles';
import { AvatarPicker } from '@/components/AvatarPicker';
import type { LearnStore } from '@/hooks/useLearnData';

interface SettingsPageProps {
  store: LearnStore;
}

export function SettingsPage({ store }: SettingsPageProps) {
  const savedIntervals = store.settings.intervals;
  const [values, setValues] = useState<string[]>(() => savedIntervals.map(String));
  const [saving, setSaving] = useState(false);

  const numbers = values.map(Number);
  const problem = validateIntervals(numbers);
  const dirty = numbers.some((value, index) => value !== savedIntervals[index]);

  function updateValue(index: number, value: string) {
    setValues((current) => current.map((item, i) => (i === index ? value : item)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (problem) return;
    setSaving(true);
    await store.updateSettings({ ...store.settings, intervals: numbers });
    setSaving(false);
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Préférences</p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Paramètres</h1>
      </header>

      <form onSubmit={handleSubmit} className={`${panelClass} space-y-6 p-6 sm:p-8`}>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Intervalles de révision</h2>
          <p className="text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            Une carte nouvelle revient après la première durée. Chaque réussite la fait passer à la durée suivante,
            jusqu'à sa validation définitive. Chaque durée doit être plus longue que la précédente, et ne pas dépasser{' '}
            {MAX_INTERVAL_DAYS} jours.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {values.map((value, index) => (
            <label key={index} className="block space-y-2">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Révision {index + 1}</span>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_INTERVAL_DAYS}
                  step={1}
                  value={value}
                  onChange={(event) => updateValue(index, event.target.value)}
                  className={`${inputClass} pr-14 tabular-nums`}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-stone-400">
                  jours
                </span>
              </div>
            </label>
          ))}
        </div>

        {problem && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {problem}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => setValues(DEFAULT_SETTINGS.intervals.map(String))} className={buttonSecondary}>
            <RotateCcw className="h-4 w-4" />
            Rétablir 1, 3, 7, 15, 30
          </button>
          <button type="submit" disabled={!dirty || saving || problem !== null} className={buttonPrimary}>
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>

      <AvatarPicker store={store} />
    </div>
  );
}
