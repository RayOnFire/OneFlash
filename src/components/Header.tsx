'use client';

import { Menu, Sparkles } from 'lucide-react';

interface HeaderProps {
  showAIBadge?: boolean;
}

export default function Header({ showAIBadge = false }: HeaderProps) {
  return (
    <header className="relative z-10 flex items-center justify-between px-4 py-3">
      <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
        <Menu className="w-6 h-6 text-white" strokeWidth={1.5} />
      </button>
      
      <div className="flex flex-col items-center">
        <h1 className="text-lg font-medium text-white">灵光</h1>
        {showAIBadge && (
          <span className="text-xs text-text-secondary mt-0.5">内容由 AI 生成</span>
        )}
      </div>
      
      <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
        <Sparkles className="w-6 h-6 text-primary" strokeWidth={1.5} />
      </button>
    </header>
  );
}

