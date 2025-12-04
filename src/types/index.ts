export interface ThinkingStep {
  id: string;
  title: string;
  content: string;
  status: 'loading' | 'completed';
  items?: string[];
}

export interface GeneratedApp {
  id: string;
  name: string;
  description: string;
  code: string;
  data: Record<string, unknown>;
  conversationId: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'creating' | 'completed';
  thinkingSteps?: ThinkingStep[];
  app?: GeneratedApp;
  suggestions?: string[];
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

