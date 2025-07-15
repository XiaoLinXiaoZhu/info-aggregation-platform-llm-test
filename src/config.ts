import * as fs from 'fs/promises';

// 类型定义
export interface LLMConfig {
  model: string;
  base_url: string;
  api_key: string;
  batch_size?: number;
}

export interface DataItem {
  spider?: string;
  url?: string;
  title?: string;
  content?: string;
  time?: string;
  [key: string]: any;
}

export interface ProcessedItem {
  original: DataItem;
  reply: {
    context: string;
    result: string;
    result_formated: {
      [key: string]: any;
    };
    time: string;
    llmConfig: {
      model: string;
    };
  };
}

// 批次统计信息接口  
export interface BatchStats {
  batchId: number;
  batchSize: number;
  duration: number;
  successCount: number;
  failedCount: number;
  totalInputChars: number;
  totalOutputChars: number;
  startTime: number;
  endTime: number;
}

// 统计信息接口
export interface ProcessStats {
  totalItems: number;
  successItems: number;
  failedItems: number;
  totalInputChars: number;
  totalOutputChars: number;
  totalDuration: number;
  averageResponseTime: number;
  startTime: number;
  endTime: number;
  batchStats?: BatchStats[];
  isConcurrent?: boolean;
}

// 读取配置文件
export async function loadConfig(): Promise<LLMConfig> {
  try {
    const configContent = await fs.readFile('llm.config.json', 'utf-8');
    return JSON.parse(configContent) as LLMConfig;
  } catch (error) {
    console.error('读取配置文件失败:', error);
    throw error;
  }
}

// 读取提示模板
export async function loadPromptTemplate(): Promise<string> {
  try {
    return await fs.readFile('llm_prompt.md', 'utf-8');
  } catch (error) {
    console.error('读取提示模板失败:', error);
    throw error;
  }
}
