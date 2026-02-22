import React from 'react';

interface Props {
  questions: string[];
  onSelect: (q: string) => void;
}

export default function QuickQuestions({ questions, onSelect }: Props) {
  return (
    <div className="mt-3 space-y-2">
      {questions.map(q => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
