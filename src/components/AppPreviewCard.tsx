'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Maximize2, ChevronDown, ChevronUp, Briefcase, GraduationCap, Home, MoreHorizontal, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AppPreviewCardProps {
  appId: string;
  name: string;
  description: string;
  code?: string;
  initialFavorite?: boolean;
}

// 默认的日程表 UI（保持向后兼容）
function DefaultScheduleApp() {
  const [selectedTime, setSelectedTime] = useState(12);
  const [selectedType, setSelectedType] = useState<string>('work');
  const [taskContent, setTaskContent] = useState('工作会议');

  const taskTypes = [
    { id: 'work', label: '工作', icon: Briefcase, color: 'bg-primary text-white' },
    { id: 'study', label: '学习', icon: GraduationCap, color: 'bg-gray-100 text-gray-700' },
    { id: 'life', label: '生活', icon: Home, color: 'bg-gray-100 text-gray-700' },
    { id: 'other', label: '其他', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700' },
  ] as const;

  const formatTime = (hours: number) => {
    return `${hours.toString().padStart(2, '0')}:00`;
  };

  const timeMarks = ['0:00', '6:00', '12:00', '18:00', '23:00'];

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <h4 className="text-base font-semibold text-gray-900">添加新任务</h4>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-600">选择时间</label>
          <div className="text-2xl font-semibold text-primary">
            {formatTime(selectedTime)}
          </div>
          
          <div className="relative pt-2 pb-1">
            <input
              type="range"
              min={0}
              max={23}
              value={selectedTime}
              onChange={(e) => setSelectedTime(Number(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-md"
            />
            <div className="flex justify-between mt-2">
              {timeMarks.map((mark) => (
                <span key={mark} className="text-xs text-gray-400">{mark}</span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-600">任务类型</label>
          <div className="grid grid-cols-2 gap-2">
            {taskTypes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedType(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                  selectedType === id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-600">任务内容</label>
          <input
            type="text"
            value={taskContent}
            onChange={(e) => setTaskContent(e.target.value)}
            placeholder="输入任务内容"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>
    </div>
  );
}

// iframe 渲染 AI 生成的代码
function IframeApp({ code, appId }: { code: string; appId: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && code) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  }, [code, appId]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full border-0"
      style={{ height: '400px' }}
      sandbox="allow-scripts allow-forms allow-same-origin"
      title="App Preview"
    />
  );
}

export default function AppPreviewCard({ appId, name, description, code, initialFavorite = false }: AppPreviewCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const supabase = createClient();

  const handleExpand = () => {
    router.push(`/app/${appId}`);
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const newFavoriteState = !isFavorite;
      
      const { error } = await supabase
        .from('apps')
        .update({ is_favorite: newFavoriteState })
        .eq('id', appId);

      if (error) {
        console.error('保存应用失败:', error);
        alert('保存失败，请重试');
        return;
      }

      setIsFavorite(newFavoriteState);
      
      // 显示保存成功提示
      if (newFavoriteState) {
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error('保存应用失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 检查是否有 AI 生成的代码
  const hasGeneratedCode = code && code.trim().length > 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-xl relative">
      {/* 保存成功提示 */}
      {showSaveSuccess && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-green-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">已保存</span>
        </div>
      )}
      
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 gap-2">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all flex-shrink-0 ${
            isFavorite 
              ? 'bg-primary text-white hover:bg-primary/90' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Zap className={`w-4 h-4 flex-shrink-0 ${isFavorite ? 'text-white' : 'text-gray-600'}`} />
          <span className="text-xs font-medium whitespace-nowrap">{isFavorite ? '已保存' : '保存'}</span>
        </button>
        
        <div className="text-center flex-1 min-w-0 px-1">
          <h3 className="text-base font-bold text-gray-900 truncate">{name}</h3>
          <p className="text-xs text-gray-500 truncate">{description}</p>
        </div>
        
        <button 
          onClick={handleExpand}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          <Maximize2 className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      {/* 应用内容区域 */}
      {isExpanded && (
        hasGeneratedCode ? (
          <IframeApp code={code} appId={appId} />
        ) : (
          <DefaultScheduleApp />
        )
      )}
      
      {/* 展开/收起按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute bottom-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors shadow-lg z-10"
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-white" />
        ) : (
          <ChevronUp className="w-5 h-5 text-white" />
        )}
      </button>
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, -10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
