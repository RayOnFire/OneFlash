'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatInput from '@/components/ChatInput';
import MessageBubble from '@/components/MessageBubble';
import { Message, ThinkingStep, GeneratedApp } from '@/types';
import { mockConversation } from '@/data/mock';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  message: string;
  thinking?: {
    title: string;
    content: string;
  };
  app?: {
    name: string;
    description: string;
    code: string;
  };
  suggestions?: string[];
  error?: string;
}

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const chatHistoryRef = useRef<ChatMessage[]>([]);
  const conversationTitleRef = useRef<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 保存对话历史到 localStorage
  const saveConversationToHistory = (title: string) => {
    const stored = localStorage.getItem('conversations');
    let conversations: { id: string; title: string; date: string }[] = [];
    
    if (stored) {
      try {
        conversations = JSON.parse(stored);
      } catch {
        conversations = [];
      }
    }
    
    // 检查是否已存在
    const existingIndex = conversations.findIndex(c => c.id === conversationId);
    if (existingIndex === -1) {
      conversations.unshift({
        id: conversationId,
        title,
        date: new Date().toISOString(),
      });
      // 最多保存 50 条
      if (conversations.length > 50) {
        conversations = conversations.slice(0, 50);
      }
      localStorage.setItem('conversations', JSON.stringify(conversations));
    }
  };

  useEffect(() => {
    // 防止 React 严格模式下重复执行
    if (initializedRef.current) return;
    initializedRef.current = true;

    // 检查是否有待处理的消息
    const pendingData = localStorage.getItem('pendingMessage');
    if (pendingData) {
      const { message } = JSON.parse(pendingData);
      localStorage.removeItem('pendingMessage');
      
      // 保存对话标题
      conversationTitleRef.current = message.slice(0, 20) + (message.length > 20 ? '...' : '');
      
      // 添加用户消息
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages([userMessage]);
      chatHistoryRef.current = [{ role: 'user', content: message }];
      
      // 保存到历史记录
      saveConversationToHistory(conversationTitleRef.current);
      
      // 调用 AI 响应
      callAI(message);
    } else {
      // 加载 Mock 数据用于演示
      setMessages(mockConversation.messages);
      conversationTitleRef.current = mockConversation.title;
      // 初始化聊天历史
      chatHistoryRef.current = mockConversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
    }
  }, [conversationId]);

  const callAI = async (userMessage: string) => {
    setIsGenerating(true);
    
    // 先显示创建中状态
    const loadingThinkingStep: ThinkingStep = {
      id: 'step-loading',
      title: '正在思考...',
      content: '让我理解您的需求，思考如何为您创建最合适的应用。',
      status: 'loading',
      items: [
        '分析用户需求，理解核心功能',
        '规划应用架构，设计交互逻辑',
      ],
    };

    const aiLoadingMessage: Message = {
      id: `msg-ai-${Date.now()}`,
      role: 'assistant',
      content: '让我来帮您实现这个想法...',
      status: 'creating',
      thinkingSteps: [loadingThinkingStep],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiLoadingMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatHistoryRef.current,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '请求失败');
      }

      const data: AIResponse = await response.json();

      // 更新聊天历史
      chatHistoryRef.current.push({
        role: 'assistant',
        content: data.message,
      });

      // 构建完成消息
      const completedMessage: Message = {
        id: aiLoadingMessage.id,
        role: 'assistant',
        content: data.message,
        status: data.app ? 'completed' : undefined,
        timestamp: new Date(),
      };

      // 如果有思考步骤
      if (data.thinking) {
        completedMessage.thinkingSteps = [
          {
            id: 'step-1',
            title: data.thinking.title,
            content: data.thinking.content,
            status: 'completed',
          },
        ];
      }

      // 如果生成了应用
      if (data.app) {
        const generatedApp: GeneratedApp = {
          id: `app-${Date.now()}`,
          name: data.app.name,
          description: data.app.description,
          code: data.app.code,
          data: {},
          conversationId,
          createdAt: new Date(),
        };
        completedMessage.app = generatedApp;
        
        // 保存应用到 localStorage
        localStorage.setItem(`lingguang_app_${generatedApp.id}`, JSON.stringify(generatedApp));
      }

      // 添加建议
      if (data.suggestions && data.suggestions.length > 0) {
        completedMessage.suggestions = data.suggestions;
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiLoadingMessage.id ? completedMessage : msg
        )
      );
    } catch (error) {
      console.error('AI 调用失败:', error);
      
      // 显示错误消息
      const errorMessage: Message = {
        id: aiLoadingMessage.id,
        role: 'assistant',
        content: `抱歉，遇到了一些问题：${error instanceof Error ? error.message : '未知错误'}。请稍后重试。`,
        timestamp: new Date(),
      };

      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiLoadingMessage.id ? errorMessage : msg
        )
      );
    }

    setIsGenerating(false);
  };

  const handleSend = (message: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // 更新聊天历史
    chatHistoryRef.current.push({ role: 'user', content: message });
    
    callAI(message);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleStop = () => {
    setIsGenerating(false);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <Header showAIBadge={true} onMenuClick={() => setIsSidebarOpen(true)} />
      
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSuggestionSelect={handleSuggestionSelect}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 底部输入区 */}
      <ChatInput
        onSend={handleSend}
        isGenerating={isGenerating}
        onStop={handleStop}
      />
    </main>
  );
}
