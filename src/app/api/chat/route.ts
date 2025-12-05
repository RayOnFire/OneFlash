import { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `你是"灵光"，一个专业且友好的 AI 助手，专门帮助用户通过对话创建轻量级的"闪应用"。

当用户提出应用需求时，生成一个简洁的 HTML 应用。

响应格式（XML）：
<message>友好回复</message>
<name>应用名称</name>
<description>简短描述</description>
<code>HTML代码</code>
<suggestions><item>建议1</item><item>建议2</item></suggestions>

【代码规范】使用 Bootstrap 5（无需写大量 CSS）：

必须在 <head> 中引入：
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
<style>body{background:linear-gradient(135deg,#1a1a2e,#16213e);min-height:100vh;}[data-bs-theme=dark]{--bs-body-bg:transparent;}</style>

在 </body> 前引入：
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

代码要求：
- 使用 data-bs-theme="dark" 启用深色主题
- 充分利用 Bootstrap 类：container, row, col, card, btn, form-control, modal, list-group 等
- 使用 Bootstrap Icons：<i class="bi bi-xxx"></i>
- JS 用箭头函数，localStorage key 用 'lg_' 前缀
- 代码要精简，不写注释

常用 Bootstrap 组件：
- 布局：container, row, col-*, d-flex, gap-*, p-*, m-*
- 卡片：card, card-body, card-header
- 按钮：btn btn-primary, btn-outline-*, btn-sm
- 表单：form-control, form-label, input-group
- 列表：list-group, list-group-item
- 模态框：modal, modal-dialog, modal-content
- 徽章：badge bg-primary
- 进度条：progress, progress-bar

如果是普通对话，只返回：
<message>回复</message>
<suggestions><item>建议1</item><item>建议2</item></suggestions>

严格按XML格式输出，代码精简。`;

// 定义流式 chunk 的类型
interface StreamChunk {
  type: 'reasoning' | 'message' | 'name' | 'description' | 'code_start' | 'code' | 'suggestions' | 'done' | 'error';
  content?: string;
  error?: string;
}

// reasoning_details 类型
interface ReasoningDetail {
  type: 'reasoning.summary' | 'reasoning.encrypted' | 'reasoning.text';
  id?: string | null;
  format?: string;
  index?: number;
  summary?: string;
  data?: string;
  text?: string;
  signature?: string | null;
}

// SSE delta 类型
interface StreamDelta {
  content?: string | null;
  reasoning_content?: string | null;
  reasoning?: string | null;
  reasoning_details?: ReasoningDetail[];
}

interface StreamChoice {
  delta?: StreamDelta;
}

interface StreamData {
  choices?: StreamChoice[];
}

// XML 标签类型
type TagType = 'message' | 'name' | 'description' | 'code' | 'suggestions' | 'item' | null;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: '未配置 OpenAI API Key' },
        { status: 500 }
      );
    }

    const model = process.env.OPENAI_MODEL || 'o1-mini';
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const reasoningEffort = process.env.REASONING_EFFORT || 'high';
    const encoder = new TextEncoder();

    const streamResponse = new ReadableStream({
      async start(controller) {
        const sendChunk = (chunk: StreamChunk) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        };

        try {
          const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
              stream: true,
              reasoning: {
                effort: reasoningEffort,
              },
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 请求失败: ${response.status} ${errorText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('无法读取响应流');
          }

          const decoder = new TextDecoder();
          let buffer = '';
          
          // XML 解析状态
          let fullContent = '';
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
                  const delta = parsed.choices?.[0]?.delta;

                  if (!delta) continue;

                  // 处理 reasoning（只处理一种格式，避免重复）
                  let hasReasoning = false;
                  
                  // 优先处理 reasoning_details 数组
                  if (delta.reasoning_details && delta.reasoning_details.length > 0) {
                    for (const detail of delta.reasoning_details) {
                      let reasoningText = '';
                      if (detail.type === 'reasoning.text' && detail.text) {
                        reasoningText = detail.text;
                      } else if (detail.type === 'reasoning.summary' && detail.summary) {
                        reasoningText = detail.summary;
                      }
                      if (reasoningText) {
                        sendChunk({ type: 'reasoning', content: reasoningText });
                        hasReasoning = true;
                      }
                    }
                  }

                  // 如果没有 reasoning_details，再处理 reasoning_content 或 reasoning
                  if (!hasReasoning) {
                    const reasoning = delta.reasoning_content || delta.reasoning;
                    if (reasoning) {
                      sendChunk({ type: 'reasoning', content: reasoning });
    }
                  }

                  // 处理 content（XML 格式）
                  if (delta.content) {
                    for (const char of delta.content) {
                      fullContent += char;
                      tagBuffer += char;

                      // 如果当前在标签内
                      if (currentTag) {
                        const endCheck = checkTagEnd(tagBuffer, currentTag);
                        if (endCheck.closed) {
                          // 标签结束
                          const tagContent = endCheck.remaining;
                          
                          if (currentTag === 'code') {
                            // code 标签结束，发送完整代码
                            codeBuffer = tagContent;
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

          // 发送完成信号
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
