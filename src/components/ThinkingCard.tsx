'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Check, ChevronDown, ChevronUp, ListChecks } from 'lucide-react';
import { ThinkingStep } from '@/types';

interface ThinkingCardProps {
  step: ThinkingStep;
}

export default function ThinkingCard({ step }: ThinkingCardProps) {
  const [isExpanded, setIsExpanded] = useState(step.status === 'loading');
  const contentRef = useRef<HTMLDivElement>(null);

  // 当内容更新时自动滚动到底部（仅在加载状态下）
  useEffect(() => {
    if (step.status === 'loading' && contentRef.current && isExpanded) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [step.content, step.status, isExpanded]);

  // 当状态从 loading 变为 completed 时，保持展开状态
  useEffect(() => {
    if (step.status === 'loading') {
      setIsExpanded(true);
    }
  }, [step.status]);

  return (
    <div className="thinking-card rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          {step.status === 'loading' ? (
            <div className="relative">
              <ListChecks className="w-5 h-5 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-text-secondary/30 flex items-center justify-center">
              <Check className="w-3 h-3 text-text-secondary" strokeWidth={2.5} />
            </div>
          )}
          <span className="text-white font-medium">{step.title}</span>
          {step.status === 'loading' && (
            <Loader2 className="w-4 h-4 text-text-secondary animate-spin" />
          )}
        </div>
        {step.content && (
          isExpanded ? (
            <ChevronUp className="w-5 h-5 text-text-secondary flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary flex-shrink-0" />
          )
        )}
      </button>
      
      {isExpanded && step.content && (
        <div className="px-4 pb-4 pt-0">
          <div className="pl-8">
            {/* 思考内容区域 */}
            <div 
              ref={contentRef}
              className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent thinking-content text-[0.8125rem] text-[#6B6B70] whitespace-pre-wrap leading-relaxed"
            >
              {step.content}
            </div>
            
            {/* 列表项（如果有） */}
            {step.items && step.items.length > 0 && (
              <ul className="space-y-2 mt-3">
                {step.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-text-secondary text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            )}
            
            {/* 加载状态提示 */}
            {step.status === 'loading' && !step.content && (
              <p className="text-text-secondary text-sm leading-relaxed">
                正在分析问题，组织思路...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
