import { Modal } from '@/components/Modal';
import { buttonPrimary, buttonSecondary } from '@/lib/styles';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }: ConfirmModalProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">{message}</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={buttonSecondary}>
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${buttonPrimary} !bg-rose-600 hover:!bg-rose-500`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
