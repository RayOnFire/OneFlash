'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AuroraBackground from '@/components/AuroraBackground';
import ChatInput from '@/components/ChatInput';

export default function HomePage() {
  const router = useRouter();

  const handleSend = (message: string) => {
    // 将消息存储到 localStorage 并跳转到对话页面
    const conversationId = `conv-${Date.now()}`;
    localStorage.setItem('pendingMessage', JSON.stringify({
      conversationId,
      message,
    }));
    router.push(`/chat/${conversationId}`);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <AuroraBackground />
      
      <Header />
      
      {/* 中央区域 - Slogan */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <h2 className="text-2xl text-white font-medium tracking-wide">
          让复杂，变简单
        </h2>
      </div>
      
      {/* 底部输入区 */}
      <ChatInput onSend={handleSend} />
    </main>
  );
}

