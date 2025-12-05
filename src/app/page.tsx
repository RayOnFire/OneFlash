'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import AuroraBackground from '@/components/AuroraBackground';
import ChatInput from '@/components/ChatInput';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function HomePage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // 获取当前用户
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSend = async (message: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // 在前端生成对话 ID，立即跳转，不等待数据库操作
    const conversationId = crypto.randomUUID();

    // 将消息和用户信息存储到 sessionStorage 用于页面间传递
    sessionStorage.setItem('pendingMessage', JSON.stringify({
      conversationId,
      message,
      userId: user.id,
      title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
      isNewConversation: true,
    }));

    // 立即跳转，不等待任何异步操作
    router.push(`/chat/${conversationId}`);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <AuroraBackground />
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} user={user} />
      
      <Header onMenuClick={() => setIsSidebarOpen(true)} user={user} />
      
      {/* 中央区域 - Slogan */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <h2 className="text-2xl text-white font-medium tracking-wide">
          让简单，变伟大
        </h2>
      </div>
      
      {/* 底部输入区 */}
      <ChatInput onSend={handleSend} />
    </main>
  );
}
