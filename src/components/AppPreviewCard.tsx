'use client';

import { useState } from 'react';
import { Zap, Maximize2, ChevronDown, ChevronUp, Briefcase, GraduationCap, Home, MoreHorizontal } from 'lucide-react';

interface Task {
  id: string;
  time: string;
  type: 'work' | 'study' | 'life' | 'other';
  content: string;
}

interface AppPreviewCardProps {
  name: string;
  description: string;
}

const taskTypes = [
  { id: 'work', label: '工作', icon: Briefcase, color: 'bg-primary text-white' },
  { id: 'study', label: '学习', icon: GraduationCap, color: 'bg-gray-100 text-gray-700' },
  { id: 'life', label: '生活', icon: Home, color: 'bg-gray-100 text-gray-700' },
  { id: 'other', label: '其他', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700' },
] as const;

export default function AppPreviewCard({ name, description }: AppPreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedTime, setSelectedTime] = useState(12);
  const [selectedType, setSelectedType] = useState<string>('work');
  const [taskContent, setTaskContent] = useState('工作会议');

  const formatTime = (hours: number) => {
    return `${hours.toString().padStart(2, '0')}:00`;
  };

  const timeMarks = ['0:00', '6:00', '12:00', '18:00', '23:00'];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-xl relative">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <Zap className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700 font-medium">保存</span>
        </button>
        
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Maximize2 className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      {/* 应用内容区域 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 添加新任务区域 */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <h4 className="text-base font-semibold text-gray-900">添加新任务</h4>
            
            {/* 时间选择 */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600">选择时间</label>
              <div className="text-2xl font-semibold text-primary">
                {formatTime(selectedTime)}
              </div>
              
              {/* 时间滑块 */}
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
            
            {/* 任务类型 */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600">任务类型</label>
              <div className="grid grid-cols-2 gap-2">
                {taskTypes.map(({ id, label, icon: Icon, color }) => (
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
            
            {/* 任务内容 */}
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
      )}
      
      {/* 展开/收起按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute bottom-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors shadow-lg"
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-white" />
        ) : (
          <ChevronUp className="w-5 h-5 text-white" />
        )}
      </button>
    </div>
  );
}

