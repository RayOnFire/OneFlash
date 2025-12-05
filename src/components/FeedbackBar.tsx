'use client';

import { RotateCcw, Share, ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackBarProps {
  onRegenerate?: () => void;
  onShare?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
}

export default function FeedbackBar({ onRegenerate, onShare, onLike, onDislike }: FeedbackBarProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onRegenerate}
        className="p-2.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
      >
        <RotateCcw className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
      </button>
      
      <button
        onClick={onShare}
        className="p-2.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
      >
        <Share className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
      </button>
      
      <button
        onClick={onLike}
        className="p-2.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
      >
        <ThumbsUp className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
      </button>
      
      <button
        onClick={onDislike}
        className="p-2.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
      >
        <ThumbsDown className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
      </button>
    </div>
  );
}

