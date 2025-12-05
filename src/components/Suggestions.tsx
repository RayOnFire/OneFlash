'use client';

import { Wand2 } from 'lucide-react';

interface SuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export default function Suggestions({ suggestions, onSelect }: SuggestionsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scroll-hide-scrollbar py-2">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className="flex items-center gap-2 px-4 py-2.5 bg-background-secondary/80 hover:bg-background-secondary border border-white/5 rounded-full whitespace-nowrap transition-colors"
        >
          <Wand2 className="w-4 h-4 text-text-secondary" />
          <span className="text-sm text-text-secondary">{suggestion}</span>
        </button>
      ))}
    </div>
  );
}

