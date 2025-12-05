'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Zap, Share2, Briefcase, GraduationCap, Home, MoreHorizontal, Plus, Calendar } from 'lucide-react';
import { GeneratedApp } from '@/types';

interface Task {
  id: string;
  time: string;
  type: 'work' | 'study' | 'life' | 'other';
  content: string;
}

const taskTypes = [
  { id: 'work', label: '工作', icon: Briefcase },
  { id: 'study', label: '学习', icon: GraduationCap },
  { id: 'life', label: '生活', icon: Home },
  { id: 'other', label: '其他', icon: MoreHorizontal },
] as const;

// 默认的日程表应用（保持向后兼容）
function DefaultScheduleApp() {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = useState(12);
  const [selectedType, setSelectedType] = useState<string>('work');
  const [taskContent, setTaskContent] = useState('工作会议');
  const [tasks, setTasks] = useState<Task[]>([]);

  const formatTime = (hours: number) => {
    return `${hours.toString().padStart(2, '0')}:00`;
  };

  const timeMarks = ['0:00', '6:00', '12:00', '18:00', '23:00'];

  const handleAddTask = () => {
    if (!taskContent.trim()) return;
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      time: formatTime(selectedTime),
      type: selectedType as Task['type'],
      content: taskContent,
    };
    
    setTasks(prev => [...prev, newTask]);
    setTaskContent('');
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      // 没有历史记录时返回首页
      router.push('/');
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* 顶部导航栏 */}
      <header className="flex items-center justify-between px-4 py-3 pt-safe">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>

        <div className="flex items-center gap-3">
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary shadow-md hover:bg-primary/90 transition-colors">
            <Zap className="w-5 h-5 text-white" />
          </button>
          
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors">
            <Share2 className="w-5 h-5 text-gray-800" />
          </button>
        </div>
      </header>

      {/* 标题区域 */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white">日程计划表</h1>
        <p className="text-sm text-text-secondary mt-1">规划您的美好一天</p>
      </div>

      {/* 应用内容区域 */}
      <div className="flex-1 px-4 pb-8 space-y-4 overflow-y-auto">
        {/* 添加新任务区域 */}
        <div className="bg-card-dark rounded-2xl p-5 space-y-5">
          <h4 className="text-lg font-semibold text-white">添加新任务</h4>
          
          {/* 时间选择 */}
          <div className="space-y-3">
            <label className="text-sm text-text-secondary">选择时间</label>
            <div className="text-3xl font-bold text-primary">
              {formatTime(selectedTime)}
            </div>
            
            {/* 时间滑块 */}
            <div className="relative pt-2 pb-1">
              <div className="relative">
                <div className="absolute inset-0 h-1 bg-gray-600 rounded-full top-1/2 -translate-y-1/2" />
                <div 
                  className="absolute h-1 bg-primary rounded-full top-1/2 -translate-y-1/2"
                  style={{ width: `${(selectedTime / 23) * 100}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={23}
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(Number(e.target.value))}
                  className="relative w-full h-6 appearance-none cursor-pointer bg-transparent z-10
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-white"
                />
              </div>
              <div className="flex justify-between mt-3">
                {timeMarks.map((mark) => (
                  <span key={mark} className="text-xs text-text-tertiary">{mark}</span>
                ))}
              </div>
            </div>
          </div>
          
          {/* 任务类型 */}
          <div className="space-y-3">
            <label className="text-sm text-text-secondary">任务类型</label>
            <div className="flex flex-wrap gap-2">
              {taskTypes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedType(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all ${
                    selectedType === id
                      ? 'bg-primary text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 任务内容 */}
          <div className="space-y-3">
            <label className="text-sm text-text-secondary">任务内容</label>
            <div className="relative">
              <input
                type="text"
                value={taskContent}
                onChange={(e) => setTaskContent(e.target.value)}
                placeholder="输入任务内容"
                className="w-full px-4 py-3.5 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
              </div>
            </div>
          </div>

          {/* 添加任务按钮 */}
          <button
            onClick={handleAddTask}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary hover:bg-primary/90 rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">添加任务</span>
          </button>
        </div>

        {/* 今日任务区域 */}
        <div className="bg-card-dark rounded-2xl p-5">
          <h4 className="text-lg font-semibold text-white mb-4">今日任务</h4>
          
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-500 text-sm">暂无任务</p>
              <p className="text-gray-600 text-xs mt-1">添加任务开始规划您的一天</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const typeConfig = taskTypes.find(t => t.id === task.type);
                const Icon = typeConfig?.icon || Briefcase;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl"
                  >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                      task.type === 'work' ? 'bg-primary/20 text-primary' :
                      task.type === 'study' ? 'bg-green-500/20 text-green-400' :
                      task.type === 'life' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{task.content}</p>
                      <p className="text-xs text-text-tertiary">{task.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// AI 生成的应用（iframe 渲染）
function GeneratedAppView({ app }: { app: GeneratedApp }) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && app.code) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(app.code);
        doc.close();
      }
    }
  }, [app.code]);

  const handleBack = () => {
    // 如果有对话 ID，返回到对应的对话页面
    if (app.conversationId) {
      router.push(`/chat/${app.conversationId}`);
    } else if (window.history.length > 1) {
      router.back();
    } else {
      // 没有历史记录时返回首页
      router.push('/');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: app.name,
          text: app.description,
          url: url,
        });
      } catch {
        // 用户取消分享
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('链接已复制到剪贴板');
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* 顶部导航栏 */}
      <header className="flex items-center justify-between px-4 py-3 pt-safe">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>

        <div className="flex items-center gap-3">
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary shadow-md hover:bg-primary/90 transition-colors">
            <Zap className="w-5 h-5 text-white" />
          </button>
          
          <button 
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-800" />
          </button>
        </div>
      </header>

      {/* 标题区域 */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white">{app.name}</h1>
        <p className="text-sm text-text-secondary mt-1">{app.description}</p>
      </div>

      {/* 应用内容区域 */}
      <div className="flex-1 px-4 pb-4">
        <div className="bg-white rounded-2xl overflow-hidden h-full">
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            style={{ minHeight: 'calc(100vh - 180px)' }}
            sandbox="allow-scripts allow-forms allow-same-origin"
            title={app.name}
          />
        </div>
      </div>
    </main>
  );
}

export default function AppViewPage() {
  const params = useParams();
  const appId = params.appId as string;
  const [app, setApp] = useState<GeneratedApp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 加载应用
    const storedApp = localStorage.getItem(`lingguang_app_${appId}`);
    if (storedApp) {
      try {
        const parsedApp = JSON.parse(storedApp);
        setApp(parsedApp);
      } catch {
        console.error('Failed to parse app data');
      }
    }
    setLoading(false);
  }, [appId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </main>
    );
  }

  // 如果找到了 AI 生成的应用，渲染它
  if (app && app.code) {
    return <GeneratedAppView app={app} />;
  }

  // 否则显示默认的日程表应用
  return <DefaultScheduleApp />;
}
