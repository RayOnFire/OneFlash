'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import ChatInput from '@/components/ChatInput';
import MessageBubble from '@/components/MessageBubble';
import { Message, ThinkingStep } from '@/types';
import { mockConversation } from '@/data/mock';

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 防止 React 严格模式下重复执行
    if (initializedRef.current) return;
    initializedRef.current = true;

    // 检查是否有待处理的消息
    const pendingData = localStorage.getItem('pendingMessage');
    if (pendingData) {
      const { message } = JSON.parse(pendingData);
      localStorage.removeItem('pendingMessage');
      
      // 添加用户消息
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages([userMessage]);
      
      // 模拟 AI 响应
      simulateAIResponse(message);
    } else {
      // 加载 Mock 数据用于演示
      setMessages(mockConversation.messages);
    }
  }, [conversationId]);

  const simulateAIResponse = async (userMessage: string) => {
    setIsGenerating(true);
    
    // 阶段1：显示创建中状态和思考卡片
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const loadingThinkingStep: ThinkingStep = {
      id: 'step-loading',
      title: '构建日程表应用框架',
      content: '我先与设计团队对齐用户需求，明确核心交互与视觉风格，确保应用既直观又高效。',
      status: 'loading',
      items: [
        '梳理用户场景，定义关键功能模块，如日程添加、提醒设置与日历视图',
        '评估数据处理逻辑，确保信息存储与检索的稳定性与响应速度',
      ],
    };

    const aiMessage: Message = {
      id: `msg-ai-${Date.now()}`,
      role: 'assistant',
      content: '我特别喜欢你这个想法！一个贴心的日程表应用，一定能帮你把生活安排得井井有条 🌟 我会用心了解你的使用场景，打造最适合你的专属助手。',
      status: 'creating',
      thinkingSteps: [loadingThinkingStep],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMessage]);
    
    // 阶段2：等待几秒后完成
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const completedMessage: Message = {
      ...aiMessage,
      status: 'completed',
      thinkingSteps: [
        {
          id: 'step-1',
          title: '部署日程表应用',
          content: '',
          status: 'completed',
        },
      ],
      app: {
        id: `app-${Date.now()}`,
        name: '日程计划表',
        description: '规划您的美好一天',
        code: '',
        data: {},
        conversationId,
        createdAt: new Date(),
      },
      suggestions: ['任务完成来个庆祝动画', '给任务加个优先级标'],
    };

    setMessages(prev => prev.map(msg => 
      msg.id === aiMessage.id ? completedMessage : msg
    ));
    
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
    simulateAIResponse(message);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleStop = () => {
    setIsGenerating(false);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header showAIBadge={true} />
      
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

