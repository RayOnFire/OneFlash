# 灵光 - AI 闪应用助手

> 让复杂，变简单

灵光是一个 AI 助手，通过对话的方式创建闪应用。用户只需用自然语言描述需求，即可快速生成可用的小应用。

## 功能特性

- 🎨 **深色主题** - 蓝紫渐变光晕背景，科技感与温暖感并存
- 💬 **对话式交互** - 自然语言描述需求，AI 实时响应
- ⚡ **闪应用生成** - 轻量级单页应用，嵌入对话流展示
- 🔄 **迭代优化** - 支持继续对话修改，快捷建议一键发送
- 📱 **移动端适配** - 完美支持移动设备访问

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **AI**: OpenAI SDK

## 项目结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主屏幕
│   ├── globals.css         # 全局样式
│   └── chat/
│       └── [conversationId]/
│           └── page.tsx    # 对话页面
├── components/
│   ├── Header.tsx          # 顶部导航栏
│   ├── AuroraBackground.tsx # 光晕背景
│   ├── ChatInput.tsx       # 输入框组件
│   ├── MessageBubble.tsx   # 消息气泡
│   ├── ThinkingCard.tsx    # 思考卡片
│   ├── AppPreviewCard.tsx  # 应用预览卡片
│   ├── Suggestions.tsx     # 快捷建议
│   └── FeedbackBar.tsx     # 反馈操作栏
├── types/
│   └── index.ts            # 类型定义
└── data/
    └── mock.ts             # Mock 数据
```

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp env.example .env.local
# 编辑 .env.local 填入你的 OpenAI API Key

# 启动开发服务器
npm run dev

# 访问应用
open http://localhost:3000
```

## 环境变量配置

在项目根目录创建 `.env.local` 文件：

```env
# OpenAI API 配置（必填）
OPENAI_API_KEY=your-api-key-here

# 可选：自定义 API 地址（如使用代理或兼容的 API 服务）
# OPENAI_BASE_URL=https://api.openai.com/v1

# 可选：自定义模型（默认使用 gpt-4o）
# OPENAI_MODEL=gpt-4o
```

支持的 API 服务：
- OpenAI 官方 API
- Azure OpenAI
- 其他兼容 OpenAI API 格式的服务（如 DeepSeek、通义千问等）

## 页面路由

| 路由 | 说明 |
|------|------|
| `/` | 主屏幕 |
| `/chat/:conversationId` | 对话详情页 |

## 配色方案

| 用途 | 颜色 |
|------|------|
| 背景色 | `#1A1A1A` |
| 光晕效果 | 蓝紫渐变 |
| 主强调色 | `#007AFF` |
| 用户气泡 | `#3A3A3C` |
| 应用卡片背景 | 白色 |
| 文字主色 | 白色 |
| 文字次要色 | `#8E8E93` |

## 开发说明

已集成 OpenAI API，支持：

1. ✅ 接入 LLM API（OpenAI 及兼容服务）
2. ✅ AI 对话和应用代码生成
3. ✅ iframe 沙箱执行生成的应用
4. ✅ Local Storage 数据持久化

### API 路由

- `POST /api/chat` - AI 对话接口，接收消息历史，返回 AI 响应和生成的应用代码

## License

MIT

