import { useState, type FormEvent } from 'react';
import { MathEditor } from '@/components/MathEditor';
import { Modal } from '@/components/Modal';
import { buttonPrimary, buttonSecondary } from '@/lib/styles';
import type { Card } from '@/types';

interface CardFormModalProps {
  initial?: Card;
  onSave: (front: string, back: string) => void;
  onClose: () => void;
}

export function CardFormModal({ initial, onSave, onClose }: CardFormModalProps) {
  const [front, setFront] = useState(initial?.front ?? '');
  const [back, setBack] = useState(initial?.back ?? '');
  const canSave = front.trim().length > 0 && back.trim().length > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    onSave(front.trim(), back.trim());
  }

  return (
    <Modal title={initial ? 'Modifier la carte' : 'Nouvelle carte'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <MathEditor
          label="Recto (question)"
          value={front}
          onChange={setFront}
          placeholder="Ex. Dérivée de $\sin(x)$ ?"
          autoFocus
        />
        <MathEditor
          label="Verso (réponse)"
          value={back}
          onChange={setBack}
          placeholder="Ex. $\cos(x)$"
        />
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
