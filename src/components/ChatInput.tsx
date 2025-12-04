'use client';

import { useState } from 'react';
import { Bot, Mic, Camera, Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isGenerating?: boolean;
  onStop?: () => void;
}

export default function ChatInput({ onSend, isGenerating = false, onStop }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isGenerating) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative z-10 p-4 pb-6">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-3 input-container rounded-full px-4 py-3">
          {/* 附件按钮 */}
          <button className="flex-shrink-0 p-1 rounded-full bg-text-secondary/20 hover:bg-text-secondary/30 transition-colors">
            <Bot className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
          </button>
          
          {/* 输入区域 */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="问一问灵光"
            className="flex-1 bg-transparent text-white placeholder-text-secondary outline-none text-base"
            disabled={isGenerating}
          />
          
          {/* 右侧按钮组 */}
          {!message.trim() && !isGenerating && (
            <>
              <button className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity">
                <Mic className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
              </button>
            </>
          )}
          
          {/* 发送按钮（有内容时显示） */}
          {message.trim() && !isGenerating && (
            <button
              onClick={handleSend}
              className="flex-shrink-0 p-2 rounded-full bg-primary hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4 text-white" strokeWidth={2} />
            </button>
          )}
          
          {/* 停止按钮（生成中显示） */}
          {isGenerating && (
            <button
              onClick={onStop}
              className="flex-shrink-0 p-2 rounded-full border border-text-secondary/50 hover:bg-white/5 transition-colors"
            >
              <Square className="w-4 h-4 text-text-secondary" fill="currentColor" strokeWidth={0} />
            </button>
          )}
        </div>
        
        {/* 相机按钮 */}
        {!message.trim() && !isGenerating && (
          <button className="flex-shrink-0 p-3 rounded-full bg-background-secondary hover:bg-background-secondary/80 transition-colors">
            <Camera className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

