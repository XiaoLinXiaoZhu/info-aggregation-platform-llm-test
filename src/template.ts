import { DataItem } from './config.js';

// 填充模板
export function fillTemplate(template: string, data: DataItem): string {
  let filledTemplate = template;
  
  // 替换模板中的所有占位符
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      const placeholder = `{ ${key} }`;
      filledTemplate = filledTemplate.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
        String(value)
      );
    }
  }
  
  return filledTemplate;
}

// 从LLM响应中提取结果
export function extractResult(response: string): { result: string; result_formated: { [key: string]: any } } {
  // 尝试提取<result>标签内的内容
  const resultMatch = response.match(/<result>([\s\S]*?)<\/result>/);
  let result = resultMatch ? resultMatch[1].trim() : '';
  
  // 清理结果中的换行符和多余空白字符
  if (result) {
    result = result
      .replace(/\r\n/g, '\n')  // 统一换行符
      .replace(/\r/g, '\n')    // 处理单独的\r
      .replace(/\n+/g, '\n')   // 合并多个换行符
      .trim();
  }
  
  // 格式化结果为结构体
  let result_formated: { [key: string]: any };
  
  if (result) {
    // 如果有提取到结果，创建结构体
    const cleanedContent = result
      .replace(/\n/g, ' ')     // 将换行符替换为空格
      .replace(/\s+/g, ' ')    // 合并多个空格
      .trim();
    
    // 尝试解析JSON内容
    let parsedContent: any = null;
    try {
      parsedContent = JSON.parse(cleanedContent);
    } catch (error) {
      // 如果解析失败，保持为字符串
      parsedContent = cleanedContent;
    }
        
    result_formated = {
      content: parsedContent,
      raw_content: cleanedContent,
      extracted: true,
      length: result.length,
      type: typeof parsedContent === 'object' ? 'json' : 'text'
    };
  } else {
    // 如果没有提取到结果，返回空结果的结构体
    const cleanedResponse = response
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
      
    result_formated = {
      content: null,
      extracted: false,
      original_response_preview: cleanedResponse,
      type: 'empty'
    };
  }
  
  return {
    result,
    result_formated
  };
}
