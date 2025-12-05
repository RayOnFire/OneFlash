'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatInput from '@/components/ChatInput';
import MessageBubble from '@/components/MessageBubble';
import { Message, ThinkingStep, GeneratedApp } from '@/types';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamChunk {
  type: 'reasoning' | 'message' | 'name' | 'description' | 'code_start' | 'code' | 'suggestions' | 'done' | 'error';
  content?: string;
  error?: string;
}

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const chatHistoryRef = useRef<ChatMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const supabase = createClient();
  const userRef = useRef<User | null>(null);
  const userPromiseRef = useRef<Promise<User | null> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 获取用户信息（使用 Promise 缓存，避免重复请求）
  const getUserOnce = () => {
    // 如果已有缓存的用户，直接返回
    if (userRef.current) {
      return Promise.resolve(userRef.current);
    }
    // 如果已有进行中的请求，等待它
    if (userPromiseRef.current) {
      return userPromiseRef.current;
    }
    // 发起新请求并缓存 Promise
    userPromiseRef.current = supabase.auth.getUser().then(({ data: { user } }) => {
      userRef.current = user;
      setUser(user);
      return user;
    });
    return userPromiseRef.current;
  };

  // 初始化时获取用户信息
  useEffect(() => {
    getUserOnce();
  }, []);

  // 保存消息到 Supabase
  const saveMessage = async (message: Message) => {
    const currentUser = await getUserOnce();
    
    if (!currentUser) {
      console.error('保存消息失败: 用户未登录');
      return;
    }

    const { error } = await supabase.from('messages').insert({
      id: message.id,
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      status: message.status,
      thinking_steps: message.thinkingSteps,
      suggestions: message.suggestions,
    });

    if (error) {
      console.error('保存消息失败:', error);
    }
  };

  // 保存应用到 Supabase
  const saveApp = async (app: GeneratedApp, messageId: string) => {
    const currentUser = await getUserOnce();
    
    if (!currentUser) {
      console.error('保存应用失败: 用户未登录');
      return app.id;
    }

    const { data, error } = await supabase
      .from('apps')
      .insert({
        user_id: currentUser.id,
        conversation_id: conversationId,
        message_id: messageId,
        name: app.name,
        description: app.description,
        code: app.code,
        data: app.data || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('保存应用失败:', error);
      return app.id;
    }

    return data.id;
  };

  useEffect(() => {
    // 防止 React 严格模式下重复执行
    if (initializedRef.current) return;
    initializedRef.current = true;

    const loadConversation = async () => {
      // 检查是否有待处理的消息（从首页传来）
      const pendingData = sessionStorage.getItem('pendingMessage');
      
      if (pendingData) {
        const { message, conversationId: pendingConvId } = JSON.parse(pendingData);
        
        if (pendingConvId === conversationId) {
          sessionStorage.removeItem('pendingMessage');
          
          // 添加用户消息
          const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: message,
            timestamp: new Date(),
          };
          
          setMessages([userMessage]);
          chatHistoryRef.current = [{ role: 'user', content: message }];
          
          // 保存消息到数据库
          await saveMessage(userMessage);
          
          // 调用 AI 响应
          callAI(message);
          return;
        }
      }

      // 从数据库加载已有消息
      const { data: dbMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('加载消息失败:', error);
        return;
      }

      if (dbMessages && dbMessages.length > 0) {
        // 加载对应的应用信息
        const { data: apps } = await supabase
          .from('apps')
          .select('*')
          .eq('conversation_id', conversationId);

        const appMap = new Map(apps?.map(app => [app.message_id, app]) || []);

        const loadedMessages: Message[] = dbMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          status: msg.status,
          thinkingSteps: msg.thinking_steps,
          suggestions: msg.suggestions,
          app: appMap.get(msg.id) ? {
            id: appMap.get(msg.id).id,
            name: appMap.get(msg.id).name,
            description: appMap.get(msg.id).description,
            code: appMap.get(msg.id).code,
            data: appMap.get(msg.id).data,
            conversationId: conversationId,
            createdAt: new Date(appMap.get(msg.id).created_at),
          } : undefined,
          timestamp: new Date(msg.created_at),
        }));

        setMessages(loadedMessages);
        chatHistoryRef.current = loadedMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));
      }
    };

    loadConversation();
  }, [conversationId]);

  const callAI = async (userMessage: string) => {
    setIsGenerating(true);
    
    // 创建 AbortController 用于取消请求
    abortControllerRef.current = new AbortController();

    const aiMessageId = crypto.randomUUID();
    
    // 初始化 AI 消息，显示思考中状态
    const initialThinkingStep: ThinkingStep = {
      id: 'step-reasoning',
      title: '正在思考...',
      content: '',
      status: 'loading',
    };

    const aiLoadingMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      status: 'creating',
      thinkingSteps: [initialThinkingStep],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiLoadingMessage]);

    // 收集流式内容
    let fullReasoning = '';
    let fullMessage = '';
    let appName = '';
    let appDescription = '';
    let appCode = '';
    let suggestions: string[] = [];
    let isGeneratingCode = false;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatHistoryRef.current,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // 解析 SSE 数据
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const chunk: StreamChunk = JSON.parse(line.slice(6));

              if (chunk.type === 'reasoning' && chunk.content) {
                fullReasoning += chunk.content;
                
                // 更新 thinking 步骤
                setMessages(prev => prev.map(msg => {
                  if (msg.id !== aiMessageId) return msg;
                  
                  const steps: ThinkingStep[] = [{
                    id: 'step-reasoning',
                    title: '深度思考中...',
                    content: fullReasoning,
                    status: 'loading' as const,
                  }];
                  
                  // 如果正在生成代码，添加代码生成步骤
                  if (isGeneratingCode) {
                    steps.push({
                      id: 'step-code',
                      title: '正在生成代码...',
                      content: '正在为您构建应用界面，请稍候...',
                      status: 'loading' as const,
                    });
                  }

                  return {
                    ...msg,
                    thinkingSteps: steps,
                  };
                }));
              }

              if (chunk.type === 'message' && chunk.content) {
                fullMessage += chunk.content;

                // 更新消息内容
                setMessages(prev => prev.map(msg => {
                  if (msg.id !== aiMessageId) return msg;
                  return {
                    ...msg,
                    content: fullMessage,
                  };
                }));
              }

              if (chunk.type === 'name' && chunk.content) {
                appName += chunk.content;
              }

              if (chunk.type === 'description' && chunk.content) {
                appDescription += chunk.content;
              }

              // 收到 code_start，显示代码生成中提示
              if (chunk.type === 'code_start') {
                isGeneratingCode = true;
                
                // 更新思考步骤，完成 reasoning，添加代码生成步骤
                setMessages(prev => prev.map(msg => {
                  if (msg.id !== aiMessageId) return msg;
                  
                  const steps: ThinkingStep[] = [];
                  
                  if (fullReasoning) {
                    steps.push({
                      id: 'step-reasoning',
                      title: '思考过程',
                      content: fullReasoning,
                      status: 'completed' as const,
                    });
                  }
                  
                  steps.push({
                    id: 'step-code',
                    title: '正在生成代码...',
                    content: '正在为您构建应用界面，请稍候...',
                    status: 'loading' as const,
                  });

                  return {
                    ...msg,
                    thinkingSteps: steps,
                  };
                }));
      }

              if (chunk.type === 'code' && chunk.content) {
                appCode = chunk.content;
                isGeneratingCode = false;
                
                // 收到完整代码，先更新 UI（应用会在 done 时保存到数据库）
                setMessages(prev => prev.map(msg => {
                  if (msg.id !== aiMessageId) return msg;
                  
                  const steps: ThinkingStep[] = [];
                  if (fullReasoning) {
                    steps.push({
                      id: 'step-reasoning',
                      title: '思考过程',
                      content: fullReasoning,
                      status: 'completed' as const,
                    });
                  }
                  
                  // 临时应用对象（ID 会在保存后更新）
                  const tempApp: GeneratedApp = {
                    id: crypto.randomUUID(),
                    name: appName.trim() || '生成的应用',
                    description: appDescription.trim() || userMessage,
                    code: appCode.trim(),
                    data: {},
                    conversationId,
                    createdAt: new Date(),
                  };
                  
                  return {
                    ...msg,
                    status: 'completed' as const,
                    app: tempApp,
                    thinkingSteps: steps.length > 0 ? steps : undefined,
                  };
                }));
              }

              if (chunk.type === 'suggestions' && chunk.content) {
                suggestions = chunk.content.split('\n').filter(s => s.trim());

                // 更新建议
                setMessages(prev => prev.map(msg => {
                  if (msg.id !== aiMessageId) return msg;
                  return {
                    ...msg,
                    suggestions,
                  };
                }));
              }

              if (chunk.type === 'done') {
                // 流式结束，构建最终消息
                const finalMessage: Message = {
                  id: aiMessageId,
                  role: 'assistant',
                  content: fullMessage.trim() || '应用已生成完成！',
                  status: appCode ? 'completed' : undefined,
                  timestamp: new Date(),
                  suggestions: suggestions.length > 0 ? suggestions : undefined,
                };

                if (fullReasoning) {
                  finalMessage.thinkingSteps = [{
                    id: 'step-reasoning',
                    title: '思考过程',
                    content: fullReasoning,
                    status: 'completed',
                  }];
                }

                // 更新聊天历史
                chatHistoryRef.current.push({
                  role: 'assistant',
                  content: fullMessage || appCode,
                });

                // 1. 先保存 AI 消息到数据库（必须先保存消息，才能保存应用）
                await saveMessage(finalMessage);

                // 2. 如果有应用代码，保存应用到数据库
                if (appCode) {
                  const generatedApp: GeneratedApp = {
                    id: crypto.randomUUID(),
                    name: appName.trim() || '生成的应用',
                    description: appDescription.trim() || userMessage,
                    code: appCode.trim(),
                    data: {},
                    conversationId,
                    createdAt: new Date(),
                  };
                  
                  // 保存应用到 Supabase（消息已保存，外键约束满足）
                  const savedAppId = await saveApp(generatedApp, aiMessageId);
                  generatedApp.id = savedAppId;
                  
                  finalMessage.app = generatedApp;
                }

                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMessageId ? finalMessage : msg
                  )
                );
              }

              if (chunk.type === 'error') {
                throw new Error(chunk.error || '未知错误');
              }
            } catch (e) {
              // 解析单行失败，继续处理下一行
              if (e instanceof SyntaxError) {
                continue;
              }
              throw e;
            }
          }
        }
      }
    } catch (error) {
      // 检查是否是用户取消
      if (error instanceof Error && error.name === 'AbortError') {
        // 用户取消，保持当前状态
        setMessages(prev => prev.map(msg => {
          if (msg.id !== aiMessageId) return msg;
          return {
            ...msg,
            content: fullMessage || '已停止生成',
            status: undefined,
            thinkingSteps: fullReasoning ? [{
              id: 'step-reasoning',
              title: '思考过程（已中断）',
              content: fullReasoning,
              status: 'completed',
            }] : undefined,
          };
        }));
      } else {
      console.error('AI 调用失败:', error);
      
      // 显示错误消息
      const errorMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: `抱歉，遇到了一些问题：${error instanceof Error ? error.message : '未知错误'}。请稍后重试。`,
        timestamp: new Date(),
      };

      await saveMessage(errorMessage);

      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId ? errorMessage : msg
        )
      );
      }
    }

    setIsGenerating(false);
    abortControllerRef.current = null;
  };

  const handleSend = async (message: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // 保存用户消息到数据库
    await saveMessage(userMessage);
    
    // 更新聊天历史
    chatHistoryRef.current.push({ role: 'user', content: message });
    
    callAI(message);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <Header showAIBadge={true} onMenuClick={() => setIsSidebarOpen(true)} user={user} />
      
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
