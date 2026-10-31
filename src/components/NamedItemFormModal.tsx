import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/Modal';
import { buttonPrimary, buttonSecondary, inputClass } from '@/lib/styles';

interface NamedItemFormModalProps {
  title: string;
  namePlaceholder: string;
  initial?: { name: string; description: string };
  onSave: (name: string, description: string) => void;
  onClose: () => void;
}

export function NamedItemFormModal({ title, namePlaceholder, initial, onSave, onClose }: NamedItemFormModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const canSave = name.trim().length > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    onSave(name.trim(), description.trim());
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Nom</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={namePlaceholder}
            className={inputClass}
            autoFocus
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Une courte description (facultatif)"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </label>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={buttonSecondary}>
            Annuler
          </button>
          <button type="submit" disabled={!canSave} className={buttonPrimary}>
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}
