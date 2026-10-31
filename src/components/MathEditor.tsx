import { useRef } from 'react';
import { MathText } from '@/components/MathText';
import { inputClass } from '@/lib/styles';

const SNIPPETS: { label: string; latex: string }[] = [
  { label: 'Fraction', latex: '\\frac{a}{b}' },
  { label: 'Racine', latex: '\\sqrt{x}' },
  { label: 'Puissance', latex: 'x^{n}' },
  { label: 'Indice', latex: 'x_{i}' },
  { label: 'Somme', latex: '\\sum_{i=1}^{n}' },
  { label: 'Intégrale', latex: '\\int_{a}^{b}' },
  { label: 'Limite', latex: '\\lim_{x \\to a}' },
  { label: 'Epsilon', latex: '\\varepsilon' },
  { label: 'Pi', latex: '\\pi' },
  { label: 'Ensemble R', latex: '\\mathbb{R}' },
  { label: 'Appartient', latex: 'x \\in E' },
  { label: 'Matrice', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
];

interface MathEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
}

export function MathEditor({ label, value, onChange, placeholder, rows = 4, autoFocus }: MathEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertSnippet(latex: string) {
    const element = textareaRef.current;
    const snippet = `$${latex}$`;
    const start = element?.selectionStart ?? value.length;
    const end = element?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + snippet + value.slice(end));
    requestAnimationFrame(() => {
      if (!element) return;
      element.focus();
      const position = start + snippet.length;
      element.setSelectionRange(position, position);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
        <span className="text-xs text-stone-400 dark:text-stone-500">Utilisez $...$ ou $$...$$</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {SNIPPETS.map((snippet) => (
          <button
            key={snippet.label}
            type="button"
            title={snippet.label}
            onClick={() => insertSnippet(snippet.latex)}
            className="shrink-0 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-sm text-stone-700 transition hover:border-brand-400 hover:bg-brand-50 active:scale-95 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:border-brand-500 dark:hover:bg-brand-950/40"
          >
            <MathText text={`$${snippet.latex}$`} />
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={`${inputClass} resize-y font-mono`}
      />
      {value.trim() && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/70 px-4 py-3 text-stone-900 dark:border-stone-700 dark:bg-stone-950/40 dark:text-stone-100">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">Aperçu</p>
          <MathText text={value} className="leading-relaxed" />
        </div>
      )}
    </div>
  );
}
