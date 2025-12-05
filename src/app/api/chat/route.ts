import { NextRequest } from 'next/server';

// 第一阶段：规划 prompt
const PLANNING_PROMPT = `你是"一闪"，专门帮用户创建"闪应用"——单个 HTML 文件的轻量级小工具。

【重要约束】闪应用的特点：
- 纯前端，单 HTML 文件，无需后端
- 使用 Bootstrap 5 + 原生 JS
- 数据存储只能用 localStorage
- 功能简单实用，5 分钟内能做完
- 不涉及：后端、数据库、登录注册、OAuth、PWA、实时同步等复杂功能

你的任务：分析用户需求，输出简洁的实现步骤。

【输出格式】使用 Markdown 无序列表 + 二级列表：

- 功能点
  - 具体功能 1
  - 具体功能 2
- 界面布局
  - 布局描述 1
  - 布局描述 2
- 交互逻辑
  - 交互说明 1
  - 交互说明 2

【示例】用户说"做一个番茄钟"：

- 功能点
  - 25 分钟工作倒计时
  - 5 分钟休息倒计时
  - 开始/暂停/重置按钮
  - 记录今日完成次数（localStorage）
- 界面布局
  - 页面居中显示大号倒计时数字
  - 下方三个控制按钮横排
  - 顶部显示今日完成次数徽章
- 交互逻辑
  - 点击开始后倒计时，按钮变为暂停
  - 倒计时结束播放提示音，自动切换工作/休息
  - 重置按钮恢复初始状态

【注意】
- 每个分类 2-4 条即可，保持简洁
- 只输出列表，不要输出其他内容
- 如果用户需求过于复杂，主动简化到闪应用能实现的范围
- 界面布局要考虑手机端，避免顶部元素过多拥挤`;

// 第二阶段：生成代码 prompt
const GENERATION_PROMPT = `你是"一闪"，专门生成"闪应用"——单个 HTML 文件的轻量级小工具。

根据提供的实现步骤，生成完整的 HTML 应用。

响应格式（XML）：
<name>应用名称（2-4字）</name>
<description>一句话描述</description>
<code>完整 HTML 代码</code>
<suggestions><item>功能建议1</item><item>功能建议2</item></suggestions>

【代码模板】必须使用：

<!DOCTYPE html>
<html lang="zh-CN" data-bs-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>应用名</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
<style>body{background:linear-gradient(135deg,#1a1a2e,#16213e);min-height:100vh;}[data-bs-theme=dark]{--bs-body-bg:transparent;}</style>
</head>
<body>
  <!-- 内容 -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    // JS 代码
  </script>
</body>
</html>

【代码规范】
- Bootstrap 类：container, card, btn, form-control, list-group, modal, badge 等
- Bootstrap Icons：<i class="bi bi-xxx"></i>
- localStorage key 用 'lg_' 前缀
- JS 用箭头函数，代码精简，不写注释

【移动端优先】必须保证手机端显示友好：
- 使用 container-fluid 或 container 保证边距
- 按钮、输入框等控件要有足够大的点击区域
- 顶部 header 不要堆太多元素，可折叠或简化
- 多个按钮/选项时使用 flex-wrap 或垂直堆叠
- 字体大小适中，重要数字可以用大号显示
- 避免横向滚动，所有内容在 375px 宽度内正常显示

严格按 XML 格式输出，<code> 标签内直接输出 HTML 代码，不要使用 CDATA。`;

// 普通对话 prompt（无需生成应用）
const CHAT_PROMPT = `你是"一闪"，一个友好的 AI 助手。用户可能与你进行普通对话。

如果用户只是聊天、问问题，或者明确不需要创建应用，请直接友好回复。

响应格式（XML）：
<message>你的回复</message>
<suggestions><item>建议1</item><item>建议2</item></suggestions>`;

// 定义流式 chunk 的类型
interface StreamChunk {
  type: 'planning_start' | 'planning' | 'planning_done' | 'generating_start' | 'message' | 'name' | 'description' | 'code_start' | 'code' | 'suggestions' | 'done' | 'error';
  content?: string;
  error?: string;
}

// SSE delta 类型
interface StreamDelta {
  content?: string | null;
}

interface StreamChoice {
  delta?: StreamDelta;
}

interface StreamData {
  choices?: StreamChoice[];
}

// XML 标签类型
type TagType = 'message' | 'name' | 'description' | 'code' | 'suggestions' | 'item' | null;

// 判断是否需要生成应用
function needsAppGeneration(messages: { role: string; content: string }[]): boolean {
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const lowerContent = lastUserMessage.toLowerCase();
  
  // 一些明确不需要生成应用的关键词
  const chatOnlyKeywords = [
    '你好', '在吗', '谢谢', '再见', '怎么样', '是什么',
    '介绍', '解释', '什么是', '为什么', '如何理解',
    'hello', 'hi', 'thanks', 'bye'
  ];
  
  // 一些明确需要生成应用的关键词
  const appKeywords = [
    '做一个', '帮我做', '生成', '创建', '写一个', '开发',
    '应用', '网页', '页面', '工具', '小程序',
    '计算器', '倒计时', '记事本', '日历', '游戏',
    'make', 'create', 'build', 'develop'
  ];
  
  // 如果包含应用相关关键词，需要生成
  for (const keyword of appKeywords) {
    if (lowerContent.includes(keyword)) {
      return true;
    }
  }
  
  // 如果只是聊天，不需要生成
  for (const keyword of chatOnlyKeywords) {
    if (lowerContent.includes(keyword) && lastUserMessage.length < 30) {
      return false;
    }
  }
  
  // 默认：消息较长的可能是应用需求
  return lastUserMessage.length > 15;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: '未配置 OpenAI API Key' },
        { status: 500 }
      );
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const encoder = new TextEncoder();

    const needsApp = needsAppGeneration(messages);

    const streamResponse = new ReadableStream({
      async start(controller) {
        const sendChunk = (chunk: StreamChunk) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        };

        try {
          if (!needsApp) {
            // 普通对话模式
          const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model,
      messages: [
                  { role: 'system', content: CHAT_PROMPT },
        ...messages,
      ],
              stream: true,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 请求失败: ${response.status} ${errorText}`);
          }

            await processXMLStream(response, sendChunk);
          } else {
            // ========= 第一阶段：规划 =========
            sendChunk({ type: 'planning_start' });

            const planningResponse = await fetch(`${baseURL}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model,
                messages: [
                  { role: 'system', content: PLANNING_PROMPT },
                  ...messages,
                ],
                stream: true,
              }),
            });

            if (!planningResponse.ok) {
              const errorText = await planningResponse.text();
              throw new Error(`规划阶段 API 请求失败: ${planningResponse.status} ${errorText}`);
            }

            // 流式输出规划内容
            const planningContent = await streamPlanningContent(planningResponse, sendChunk);
            
            sendChunk({ type: 'planning_done' });

            // ========= 第二阶段：生成代码 =========
            sendChunk({ type: 'generating_start' });

            const generationResponse = await fetch(`${baseURL}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model,
                messages: [
                  { role: 'system', content: GENERATION_PROMPT },
                  ...messages,
                  { role: 'assistant', content: `以下是实现步骤：\n\n${planningContent}` },
                  { role: 'user', content: '请根据上述实现步骤，生成完整的 HTML 应用代码。' },
                ],
                stream: true,
              }),
            });

            if (!generationResponse.ok) {
              const errorText = await generationResponse.text();
              throw new Error(`生成阶段 API 请求失败: ${generationResponse.status} ${errorText}`);
            }

            // 流式输出生成内容
            await processXMLStream(generationResponse, sendChunk);
          }

          sendChunk({ type: 'done' });
        } catch (error) {
          console.error('API error:', error);
          sendChunk({
            type: 'error',
            error: error instanceof Error ? error.message : '调用 AI 服务失败',
          });
        }

        controller.close();
      },
    });

    return new Response(streamResponse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Request error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '请求处理失败' },
      { status: 500 }
    );
  }
}

// 流式输出规划内容
async function streamPlanningContent(
  response: Response,
  sendChunk: (chunk: StreamChunk) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed: StreamData = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          
          if (content) {
            fullContent += content;
            sendChunk({ type: 'planning', content });
          }
        } catch {
          // 解析失败，跳过
        }
      }
    }
  }

  return fullContent;
}

// 处理 XML 格式的流式响应
async function processXMLStream(
  response: Response,
  sendChunk: (chunk: StreamChunk) => void
): Promise<void> {
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('无法读取响应流');
          }

          const decoder = new TextDecoder();
          let buffer = '';
          
          // XML 解析状态
          let currentTag: TagType = null;
          let tagBuffer = '';
          let codeBuffer = '';
          let suggestionsBuffer = '';
          let codeStartSent = false;

          // 检测标签开始
          const checkTagStart = (content: string): { tag: TagType; remaining: string } | null => {
            const tags: TagType[] = ['message', 'name', 'description', 'code', 'suggestions', 'item'];
            for (const tag of tags) {
              const openTag = `<${tag}>`;
              if (content.endsWith(openTag)) {
                return { tag, remaining: content.slice(0, -openTag.length) };
              }
            }
            return null;
          };

          // 检测标签结束
          const checkTagEnd = (content: string, tag: TagType): { closed: boolean; remaining: string } => {
            if (!tag) return { closed: false, remaining: content };
            const closeTag = `</${tag}>`;
            if (content.endsWith(closeTag)) {
              return { closed: true, remaining: content.slice(0, -closeTag.length) };
            }
            return { closed: false, remaining: content };
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;

                try {
                  const parsed: StreamData = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;

          if (content) {
            for (const char of content) {
                      tagBuffer += char;

                      // 如果当前在标签内
                      if (currentTag) {
                        const endCheck = checkTagEnd(tagBuffer, currentTag);
                        if (endCheck.closed) {
                          // 标签结束
                          const tagContent = endCheck.remaining;
                          
                          if (currentTag === 'code') {
                            // code 标签结束，发送完整代码（清理 CDATA 标记）
                            codeBuffer = tagContent
                              .replace(/^<!\[CDATA\[/, '')
                              .replace(/\]\]>$/, '')
                              .trim();
                            sendChunk({ type: 'code', content: codeBuffer });
                          } else if (currentTag === 'item') {
                            // item 标签结束，添加到 suggestions
                            if (suggestionsBuffer) suggestionsBuffer += '\n';
                            suggestionsBuffer += tagContent;
                          } else if (currentTag === 'suggestions') {
                            // suggestions 标签结束，发送完整建议
                            sendChunk({ type: 'suggestions', content: suggestionsBuffer });
                            suggestionsBuffer = '';
                          }
                          
                          currentTag = null;
                          tagBuffer = '';
                          codeStartSent = false;
                        } else if (currentTag === 'code' && !codeStartSent) {
                          // code 标签刚开始，发送提示
                          sendChunk({ type: 'code_start' });
                          codeStartSent = true;
                        } else if (currentTag !== 'code' && currentTag !== 'suggestions' && currentTag !== 'item') {
                          // 非 code/suggestions/item 标签，流式发送
                          const closeTag = `</${currentTag}>`;
                          const safeLength = tagBuffer.length - closeTag.length;
                          if (safeLength > 0) {
                            const safeContent = tagBuffer.slice(0, safeLength);
                            sendChunk({ type: currentTag, content: safeContent });
                            tagBuffer = tagBuffer.slice(safeLength);
                          }
                        }
                      } else {
                        // 检测新标签开始
                        const startCheck = checkTagStart(tagBuffer);
                        if (startCheck) {
                          currentTag = startCheck.tag;
                          tagBuffer = '';
                        }
                      }
                    }
                  }
    } catch {
                  // 解析失败，跳过
                }
              }
            }
  }
}
