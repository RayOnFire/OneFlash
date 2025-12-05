'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, RefreshCw, Bookmark, Sparkles, Settings } from 'lucide-react';

interface ConversationHistory {
  id: string;
  title: string;
  date: Date;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// 按日期分组历史记录
function groupByDate(conversations: ConversationHistory[]) {
  const groups: { [key: string]: ConversationHistory[] } = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  conversations.forEach(conv => {
    const convDate = new Date(conv.date);
    const convDay = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());
    
    let groupKey: string;
    if (convDay.getTime() === today.getTime()) {
      groupKey = '今天';
    } else if (convDay.getTime() === yesterday.getTime()) {
      groupKey = '昨天';
    } else if (convDay.getTime() > lastWeek.getTime()) {
      groupKey = '最近7天';
    } else {
      groupKey = '更早';
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(conv);
  });

  return groups;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);

  // 从 localStorage 加载历史对话
  useEffect(() => {
    const loadConversations = () => {
      const stored = localStorage.getItem('conversations');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setConversations(parsed.map((c: { id: string; title: string; date: string }) => ({
            ...c,
            date: new Date(c.date)
          })));
        } catch {
          setConversations([]);
        }
      } else {
        // Mock data for demo
        setConversations([
          {
            id: 'conv-demo-1',
            title: '编写日程表应用',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨天
          }
        ]);
      }
    };

    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const handleNewChat = () => {
    onClose();
    router.push('/');
  };

  const handleConversationClick = (id: string) => {
    onClose();
    router.push(`/chat/${id}`);
  };

  const groupedConversations = groupByDate(conversations);
  const groupOrder = ['今天', '昨天', '最近7天', '更早'];

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* 侧边栏 */}
      <aside 
        className={`fixed top-0 left-0 h-full w-[80%] max-w-[320px] bg-[#1C1C1E] z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 顶部品牌区 */}
        <div className="flex items-center justify-between px-4 pt-14 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-white">灵光</span>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* 新对话按钮 */}
        <div className="px-4 mb-4">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#2C2C2E] hover:bg-[#3A3A3C] rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-white/80" strokeWidth={2} />
            <span className="text-white/90 text-sm font-medium">开启新对话</span>
          </button>
        </div>

        {/* 菜单项 */}
        <div className="px-4 space-y-1">
          <button className="w-full flex items-center justify-between py-3 px-2 hover:bg-white/5 rounded-lg transition-colors group">
            <div className="flex items-center gap-3">
              <Bookmark className="w-5 h-5 text-white/60 group-hover:text-white/80" strokeWidth={1.5} />
              <span className="text-white/80 text-sm group-hover:text-white">我的收藏</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40" />
          </button>
          
          <button className="w-full flex items-center justify-between py-3 px-2 hover:bg-white/5 rounded-lg transition-colors group">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-white/60 group-hover:text-white/80" strokeWidth={1.5} />
              <span className="text-white/80 text-sm group-hover:text-white">我的创作</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40" />
          </button>
        </div>

        {/* 分割线 */}
        <div className="mx-4 my-4 h-px bg-white/10" />

        {/* 历史记录区 */}
        <div className="flex-1 overflow-y-auto px-4 scroll-hide-scrollbar">
          {groupOrder.map(groupKey => {
            const group = groupedConversations[groupKey];
            if (!group || group.length === 0) return null;
            
            return (
              <div key={groupKey} className="mb-4">
                <h3 className="text-xs text-white/40 mb-2 px-2">{groupKey}</h3>
                <div className="space-y-1">
                  {group.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => handleConversationClick(conv.id)}
                      className="w-full text-left py-2.5 px-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <span className="text-white/90 text-sm font-medium line-clamp-1">
                        {conv.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* 没有更多内容提示 */}
          <div className="flex justify-center py-4">
            <span className="text-sm text-white/30">没有更多内容啦</span>
          </div>
        </div>

        {/* 底部用户区 */}
        <div className="px-4 py-6 flex items-center justify-between border-t border-white/5">
          <button className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center hover:opacity-90 transition-opacity">
            <span className="text-xs font-bold text-black/70">ABCDEFG</span>
          </button>
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-white/60" strokeWidth={1.5} />
          </button>
        </div>
      </aside>
    </>
  );
}

