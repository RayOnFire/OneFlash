'use client';

import { useState } from 'react';
import { Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { ThinkingStep } from '@/types';

interface ThinkingCardProps {
  step: ThinkingStep;
}

export default function ThinkingCard({ step }: ThinkingCardProps) {
  const [isExpanded, setIsExpanded] = useState(step.status === 'loading');

  return (
    <div className="thinking-card rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          {step.status === 'loading' ? (
            <Loader2 className="w-5 h-5 text-text-secondary animate-spin" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-text-secondary/30 flex items-center justify-center">
              <Check className="w-3 h-3 text-text-secondary" strokeWidth={2.5} />
            </div>
          )}
          <span className="text-white font-medium">{step.title}</span>
        </div>
        {step.content && (
          isExpanded ? (
            <ChevronUp className="w-5 h-5 text-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary" />
          )
        )}
      </button>
      
      {isExpanded && step.content && (
        <div className="px-4 pb-4 pt-0">
          <div className="pl-8 space-y-3">
            <p className="text-text-secondary text-sm leading-relaxed">
              {step.content}
            </p>
            {step.items && step.items.length > 0 && (
              <ul className="space-y-2">
                {step.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-text-secondary text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            )}
            {step.status === 'loading' && (
              <p className="text-text-secondary text-sm leading-relaxed">
                方案已就绪，接下来将进入开发阶段，逐步实现核心功能。
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

