import katex from 'katex';
import { useMemo } from 'react';

const MATH_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

interface MathTextProps {
  text: string;
  className?: string;
}

export function MathText({ text, className = '' }: MathTextProps) {
  const parts = useMemo(() => text.split(MATH_PATTERN), [text]);

  return (
    <span className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, index) => {
        if (index % 2 === 0) return <span key={index}>{part}</span>;
        const isDisplay = part.startsWith('$$');
        const source = (isDisplay ? part.slice(2, -2) : part.slice(1, -1)).trim();
        const html = katex.renderToString(source, {
          displayMode: isDisplay,
          throwOnError: false,
          output: 'html',
        });
        return (
          <span
            key={index}
            className={isDisplay ? 'my-2 block overflow-x-auto text-center' : ''}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
}
