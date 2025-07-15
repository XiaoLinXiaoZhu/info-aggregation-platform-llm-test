import { LLMConfig } from './config.js';

// 调用 LLM API，返回结果和耗时
export async function callLLM(config: LLMConfig, prompt: string): Promise<{ content: string; duration: number; inputChars: number; outputChars: number }> {
  const startTime = Date.now();
  const inputChars = prompt.length;
  
  try {
    const response = await fetch(`${config.base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '无响应';
    const endTime = Date.now();
    const duration = endTime - startTime;
    const outputChars = content.length;

    return {
      content,
      duration,
      inputChars,
      outputChars
    };
  } catch (error) {
    console.error('调用 LLM API 失败:', error);
    const endTime = Date.now();
    const duration = endTime - startTime;
    const errorContent = `错误: ${error}`;
    
    return {
      content: errorContent,
      duration,
      inputChars,
      outputChars: errorContent.length
    };
  }
}

// 添加请求延迟
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
