'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Sparkles, LogOut, User as UserIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  showAIBadge?: boolean;
  onMenuClick?: () => void;
  user?: User | null;
}

export default function Header({ showAIBadge = false, onMenuClick, user }: HeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  // 获取用户邮箱首字母
  const getInitial = () => {
    if (!user?.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="relative z-10 flex items-center justify-between px-4 py-3">
      <button 
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <Menu className="w-6 h-6 text-white" strokeWidth={1.5} />
      </button>
      
      <div className="flex flex-col items-center">
        <h1 className="text-lg font-medium text-white">灵光</h1>
        {showAIBadge && (
          <span className="text-xs text-text-secondary mt-0.5">内容由 AI 生成</span>
        )}
      </div>
      
      {/* 用户区域 */}
      <div className="relative">
        {user ? (
          <>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <span className="text-sm font-medium text-white">{getInitial()}</span>
            </button>
            
            {/* 用户菜单 */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-card-dark rounded-xl shadow-xl border border-white/10 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-xs text-text-secondary">已登录</p>
                    <p className="text-sm text-white truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">退出登录</span>
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <button 
            onClick={handleLogin}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <UserIcon className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </header>
  );
}
