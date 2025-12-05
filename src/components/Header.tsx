'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Sparkles, LogOut, User as UserIcon, Zap, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface SavedApp {
  id: string;
  name: string;
  description: string;
  created_at: string;
  is_favorite: boolean;
}

interface HeaderProps {
  showAIBadge?: boolean;
  onMenuClick?: () => void;
  user?: User | null;
  showFlashIcon?: boolean; // 显示 Flash 图标而非用户头像
}

export default function Header({ showAIBadge = false, onMenuClick, user, showFlashIcon = false }: HeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAppsDrawer, setShowAppsDrawer] = useState(false);
  const [savedApps, setSavedApps] = useState<SavedApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const flashButtonRef = useRef<HTMLButtonElement>(null);
  const supabase = createClient();

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showUserMenu &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // 加载用户保存的应用
  const loadSavedApps = async () => {
    if (!user) return;
    
    setLoadingApps(true);
    try {
      const { data, error } = await supabase
        .from('apps')
        .select('id, name, description, created_at, is_favorite')
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSavedApps(data);
      }
    } catch (error) {
      console.error('加载应用失败:', error);
    } finally {
      setLoadingApps(false);
    }
  };

  // 打开应用抽屉
  const handleOpenAppsDrawer = () => {
    setShowAppsDrawer(true);
    loadSavedApps();
  };

  // 导航到应用详情
  const handleAppClick = (appId: string) => {
    setShowAppsDrawer(false);
    router.push(`/app/${appId}`);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowUserMenu(false);
    
    try {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('退出登录失败:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  // 获取用户邮箱首字母
  const getInitial = () => {
    if (!user?.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <header className="relative z-10 flex items-center justify-between px-4 py-3">
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Menu className="w-6 h-6 text-white" strokeWidth={1.5} />
        </button>
        
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-medium text-white">一闪</h1>
          {showAIBadge && (
            <span className="text-xs text-text-secondary mt-0.5">内容由 AI 生成</span>
          )}
        </div>
        
        {/* 右侧区域 - Flash 图标或用户头像 */}
        <div className="relative">
          {showFlashIcon ? (
            // Chat 页面显示 Flash 图标
            <button 
              ref={flashButtonRef}
              onClick={handleOpenAppsDrawer}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-primary shadow-md hover:bg-primary/90 transition-colors"
            >
              <Zap className="w-5 h-5 text-white" />
            </button>
          ) : user ? (
            <>
              <button 
                ref={buttonRef}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                <span className="text-sm font-medium text-white">{getInitial()}</span>
              </button>
              
              {/* 用户菜单 */}
              {showUserMenu && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 top-full mt-2 w-48 bg-card-dark rounded-xl shadow-xl border border-white/10 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-xs text-text-secondary">已登录</p>
                    <p className="text-sm text-white truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">
                      {isLoggingOut ? '退出中...' : '退出登录'}
                    </span>
                  </button>
                </div>
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

      {/* 保存的应用抽屉 */}
      {showAppsDrawer && (
        <div className="fixed inset-0 z-50">
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAppsDrawer(false)}
          />
          
          {/* 抽屉面板 */}
          <div 
            ref={drawerRef}
            className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card-dark shadow-2xl flex flex-col animate-slide-in-right"
          >
            {/* 抽屉头部 */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-white">我的闪应用</h2>
              </div>
              <button 
                onClick={() => setShowAppsDrawer(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* 应用列表 */}
            <div className="flex-1 overflow-y-auto">
              {loadingApps ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : savedApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Zap className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm">还没有保存的闪应用</p>
                  <p className="text-gray-500 text-xs mt-1">在应用预览界面点击闪电图标保存</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {savedApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleAppClick(app.id)}
                      className="w-full p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl text-left transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate group-hover:text-primary transition-colors">
                            {app.name}
                          </h3>
                          <p className="text-text-secondary text-sm truncate mt-0.5">
                            {app.description || '暂无描述'}
                          </p>
                          <p className="text-text-tertiary text-xs mt-1">
                            {formatDate(app.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
