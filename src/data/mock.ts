import { Conversation, Message } from '@/types';

export const mockConversation: Conversation = {
  id: 'conv-1',
  title: '日程表应用',
  createdAt: new Date(),
  updatedAt: new Date(),
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: '帮我写一个日程表应用',
      timestamp: new Date(),
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: '我特别喜欢你这个想法！一个贴心的日程表应用，一定能帮你把生活安排得井井有条 🌟 我会用心了解你的使用场景，打造最适合你的专属助手。',
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
        id: 'app-1',
        name: '日程计划表',
        description: '规划您的美好一天',
        code: '',
        data: {},
        conversationId: 'conv-1',
        createdAt: new Date(),
      },
      suggestions: ['任务完成来个庆祝动画', '给任务加个优先级标'],
      timestamp: new Date(),
    },
  ],
};

export const mockLoadingConversation: Conversation = {
  id: 'conv-2',
  title: '日程表应用',
  createdAt: new Date(),
  updatedAt: new Date(),
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: '帮我写一个日程表应用',
      timestamp: new Date(),
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: '我特别喜欢你这个想法！一个贴心的日程表应用，一定能帮你把生活安排得井井有条 🌟 我会用心了解你的使用场景，打造最适合你的专属助手。',
      status: 'creating',
      thinkingSteps: [
        {
          id: 'step-1',
          title: '构建日程表应用框架',
          content: '我先与设计团队对齐用户需求，明确核心交互与视觉风格，确保应用既直观又高效。',
          status: 'loading',
          items: [
            '梳理用户场景，定义关键功能模块，如日程添加、提醒设置与日历视图',
            '评估数据处理逻辑，确保信息存储与检索的稳定性与响应速度',
          ],
        },
      ],
      timestamp: new Date(),
    },
  ],
};

export const createEmptyMessage = (role: 'user' | 'assistant', content: string): Message => ({
  id: `msg-${Date.now()}`,
  role,
  content,
  timestamp: new Date(),
});

