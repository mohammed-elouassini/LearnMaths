import { useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, RotateCcw } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { imageFileToAvatarDataUrl } from '@/lib/avatar';
import { buttonSecondary, panelClass } from '@/lib/styles';
import type { LearnStore } from '@/hooks/useLearnData';

interface AvatarPickerProps {
  store: LearnStore;
}

export function AvatarPicker({ store }: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarDataUrl = store.settings.avatarDataUrl;

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choisissez un fichier image (JPEG, PNG, WebP…).');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const nextAvatar = await imageFileToAvatarDataUrl(file);
      await store.updateSettings({ ...store.settings, avatarDataUrl: nextAvatar });
    } catch {
      setError("Cette image n'a pas pu être importée.");
    } finally {
      setBusy(false);
    }
  }

  async function restoreSigma() {
    setBusy(true);
    await store.updateSettings({ ...store.settings, avatarDataUrl: null });
    setBusy(false);
  }

  return (
    <section className={`${panelClass} flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8`}>
      <BrandLogo avatarDataUrl={avatarDataUrl} className="h-20 w-20 rounded-2xl shadow-sm" iconClassName="h-9 w-9" />

      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Photo de profil</h2>
          <p className="text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            Cette image remplace le sigma dans le logo de l'application. Elle est recadrée en carré.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleFile(event)} />
          <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className={buttonSecondary}>
            <ImagePlus className="h-4 w-4" />
            {busy ? 'Enregistrement…' : 'Importer une image'}
          </button>
          {avatarDataUrl && (
            <button type="button" disabled={busy} onClick={() => void restoreSigma()} className={buttonSecondary}>
              <RotateCcw className="h-4 w-4" />
              Revenir au sigma
            </button>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-rose-700 dark:text-rose-300">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
