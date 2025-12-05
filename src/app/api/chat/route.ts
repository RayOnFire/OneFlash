import OpenAI from 'openai';
import { NextRequest } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

const SYSTEM_PROMPT = `你是"灵光"，一个专业且友好的 AI 助手，专门帮助用户通过对话创建轻量级的"闪应用"。

你的特点：
- 热情友好，使用温暖的语气
- 善于理解用户意图
- 能够生成精美的单页应用

当用户提出应用需求时，你需要：
1. 首先用友好的语气回应用户的想法
2. 然后生成一个完整的 HTML 应用（包含内联 CSS 和 JavaScript）

你的响应必须使用以下 JSON 格式：
{
  "message": "你对用户的友好回复",
  "thinking": {
    "title": "思考步骤的标题（如：构建XX应用框架）",
    "content": "你的思考过程描述"
  },
  "app": {
    "name": "应用名称",
    "description": "应用的简短描述",
    "code": "完整的 HTML 代码（包含内联的 CSS 和 JavaScript）"
  },
  "suggestions": ["建议1", "建议2"]
}

对于 app.code，要求：
- 必须是完整的 HTML 文档
- 使用现代化、美观的 UI 设计
- 使用内联 CSS 样式（不要使用外部样式表）
- 如果需要 JavaScript，使用内联脚本
- 使用 localStorage 存储数据
- 设计要精美，有渐变色、圆角、阴影等现代 UI 元素
- 配色方案使用蓝紫色调为主

如果用户只是普通对话（不是创建应用），则只返回：
{
  "message": "你的回复",
  "suggestions": ["相关建议1", "相关建议2"]
}

记住：永远返回有效的 JSON 格式，不要包含任何额外的文字或代码块标记。`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: '未配置 OpenAI API Key' },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      return Response.json(
        { error: 'AI 返回了空内容' },
        { status: 500 }
      );
    }

    try {
      const parsedContent = JSON.parse(content);
      return Response.json(parsedContent);
    } catch {
      return Response.json(
        { error: '解析 AI 响应失败', raw: content },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '调用 AI 服务失败' },
      { status: 500 }
    );
  }
}

