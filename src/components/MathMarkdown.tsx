import React from 'react';

interface MathMarkdownProps {
  content: string;
  className?: string;
}

export const MathMarkdown: React.FC<MathMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Format bold text **something** and math-specific elements
  // We can render line breaks, bold text, inline code/math formulas with clean styling
  const lines = content.split('\n');

  return (
    <div className={`space-y-1 text-slate-800 dark:text-slate-200 leading-relaxed ${className}`}>
      {lines.map((line, lineIdx) => {
        if (!line.trim()) return <div key={lineIdx} className="h-2" />;

        // Simple markdown parser for bold (**text**), code/math (`text` or $text$), and bullet points
        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        const cleanLine = isBullet ? line.trim().substring(2) : line;

        // Split by markdown bold (**...**)
        const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`|\$.*?\$)/g);

        return (
          <div key={lineIdx} className={isBullet ? 'flex items-start gap-2 pl-2' : ''}>
            {isBullet && <span className="text-amber-500 font-bold">•</span>}
            <p className="flex-1">
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                if ((part.startsWith('`') && part.endsWith('`')) || (part.startsWith('$') && part.endsWith('$'))) {
                  return (
                    <code
                      key={pIdx}
                      className="mx-0.5 rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-sm font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                    >
                      {part.slice(1, -1)}
                    </code>
                  );
                }
                return <React.Fragment key={pIdx}>{part}</React.Fragment>;
              })}
            </p>
          </div>
        );
      })}
    </div>
  );
};
