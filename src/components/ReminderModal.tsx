import { useState } from 'react';
import { BellRing } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { canNotify } from '@/hooks/useDailyReminder';
import { buttonPrimary, buttonSecondary, inputClass } from '@/lib/styles';
import type { LearnStore } from '@/hooks/useLearnData';

interface ReminderModalProps {
  store: LearnStore;
  onClose: () => void;
}

function permissionMessage(permission: NotificationPermission | 'unsupported') {
  switch (permission) {
    case 'granted':
      return 'Les notifications sont activées sur cet appareil.';
    case 'denied':
      return 'Les notifications sont bloquées. Autorisez-les dans les réglages de votre navigateur pour ce site.';
    case 'unsupported':
      return 'Votre navigateur ne permet pas d\'afficher les notifications.';
    default:
      return "Autorisez les notifications pour recevoir votre rappel chaque jour où vous avez des devoirs.";
  }
}

export function ReminderModal({ store, onClose }: ReminderModalProps) {
  const [hour, setHour] = useState(store.settings.reminderHour);
  const [saving, setSaving] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    canNotify() ? Notification.permission : 'unsupported',
  );

  async function requestPermission() {
    if (!canNotify()) return;
    setPermission(await Notification.requestPermission());
  }

  async function save() {
    setSaving(true);
    const ok = await store.updateSettings({ ...store.settings, reminderHour: hour });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal title="Rappel quotidien" onClose={onClose}>
      <div className="space-y-6">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Me prévenir chaque jour où j'ai des devoirs, à
          </span>
          <select value={hour} onChange={(event) => setHour(Number(event.target.value))} className={inputClass}>
            {Array.from({ length: 24 }, (_, value) => (
              <option key={value} value={value}>
                {String(value).padStart(2, '0')} h
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-4 dark:bg-stone-800/60">
          <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">{permissionMessage(permission)}</p>
            {permission === 'default' && (
              <button type="button" onClick={() => void requestPermission()} className={buttonSecondary}>
                Autoriser les notifications
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={buttonSecondary}>
            Annuler
          </button>
          <button type="button" onClick={() => void save()} disabled={saving} className={buttonPrimary}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
