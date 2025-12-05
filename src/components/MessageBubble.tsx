'use client';

import { Sparkles } from 'lucide-react';
import { Streamdown } from 'streamdown';
import { Message } from '@/types';
import ThinkingCard from './ThinkingCard';
import AppPreviewCard from './AppPreviewCard';
import Suggestions from './Suggestions';
import FeedbackBar from './FeedbackBar';

interface MessageBubbleProps {
  message: Message;
  onSuggestionSelect?: (suggestion: string) => void;
}

export default function MessageBubble({ message, onSuggestionSelect }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-4 py-3 bg-user-bubble rounded-2xl rounded-tr-md">
          <p className="text-white text-base">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="space-y-4">
      {/* 状态指示 */}
      {message.status && (
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-text-secondary">
            {message.status === 'creating' ? '应用创建中...' : '应用创建成功'}
          </span>
        </div>
      )}
      
      {/* 思考卡片 - 放在消息内容上方 */}
      {message.thinkingSteps && message.thinkingSteps.length > 0 && (
        <div className="space-y-3">
          {message.thinkingSteps.map((step) => (
            <ThinkingCard key={step.id} step={step} />
          ))}
        </div>
      )}
      
      {/* 消息内容 - 使用 streamdown 渲染 */}
      {message.content && (
        <div className="text-white text-base leading-relaxed message-content">
          <Streamdown>{message.content}</Streamdown>
        </div>
      )}
      
      {/* 应用预览卡片 */}
      {message.app && (
        <AppPreviewCard
          appId={message.app.id}
          name={message.app.name}
          description={message.app.description}
          code={message.app.code}
          initialFavorite={message.app.isFavorite}
        />
      )}
      
      {/* 快捷建议 */}
      {message.suggestions && message.suggestions.length > 0 && (
        <Suggestions
          suggestions={message.suggestions}
          onSelect={onSuggestionSelect || (() => {})}
        />
      )}
      
      {/* 反馈操作栏 */}
      {message.status === 'completed' && message.app && (
        <FeedbackBar />
      )}
    </div>
  );
}
