import { LLMConfig, DataItem, ProcessedItem } from './config.js';
import { fillTemplate, extractResult } from './template.js';
import { callLLM, delay } from './llm.js';
import { loadDataFile, saveFileResults } from './fileUtils.js';
import * as path from 'path';

// 处理单个数据项
export async function processDataItem(
  item: DataItem,
  template: string,
  config: LLMConfig,
  itemIndex: number
): Promise<ProcessedItem> {
  console.log(`处理第 ${itemIndex + 1} 个项目: ${item.title?.substring(0, 50)}...`);
  
  // 填充模板
  const filledPrompt = fillTemplate(template, item);
  
  // 调用 LLM
  const response = await callLLM(config, filledPrompt);
  
  // 提取结果
  const { result, result_formated } = extractResult(response);
  
  // 构建处理结果
  const processedItem: ProcessedItem = {
    original: item,
    reply: {
      context: response,
      result: result,
      result_formated: result_formated,
      time: new Date().toISOString(),
      llmConfig: {
        model: config.model
      }
    }
  };
  
  console.log(`✓ 处理完成，响应长度: ${response.length} 字符`);
  
  return processedItem;
}

// 处理单个数据文件
export async function processDataFile(
  filePath: string,
  template: string,
  config: LLMConfig,
  options: {
    maxItems?: number;
    delayMs?: number;
    saveIndividually?: boolean;
  } = {}
): Promise<ProcessedItem[]> {
  const { maxItems, delayMs = 1000, saveIndividually = true } = options;
  
  console.log(`\n=== 处理文件: ${path.basename(filePath)} ===`);
  
  // 加载数据
  const dataItems = await loadDataFile(filePath);
  const itemsToProcess = maxItems ? dataItems.slice(0, maxItems) : dataItems;
  
  console.log(`文件包含 ${dataItems.length} 个数据项，处理 ${itemsToProcess.length} 个`);
  
  const results: ProcessedItem[] = [];
  
  // 顺序处理每个数据项
  for (let i = 0; i < itemsToProcess.length; i++) {
    try {
      const item = itemsToProcess[i];
      const processedItem = await processDataItem(item, template, config, i);
      results.push(processedItem);
      
      // 添加延迟避免请求过快
      if (i < itemsToProcess.length - 1) {
        await delay(delayMs);
      }
    } catch (error) {
      console.error(`处理第 ${i + 1} 个项目时出错:`, error);
      // 继续处理下一个项目
    }
  }
  
  // 保存当前文件的结果
  if (saveIndividually && results.length > 0) {
    await saveFileResults(results, path.basename(filePath));
  }
  
  console.log(`文件 ${path.basename(filePath)} 处理完成，成功处理 ${results.length} 个项目`);
  
  return results;
}

// 批量处理多个文件
export async function processAllFiles(
  filePaths: string[],
  template: string,
  config: LLMConfig,
  options: {
    maxItemsPerFile?: number;
    delayMs?: number;
    saveIndividually?: boolean;
  } = {}
): Promise<ProcessedItem[]> {
  const allResults: ProcessedItem[] = [];
  
  console.log(`开始批量处理 ${filePaths.length} 个文件...`);
  
  for (const filePath of filePaths) {
    try {
      const results = await processDataFile(filePath, template, config, options);
      allResults.push(...results);
    } catch (error) {
      console.error(`处理文件 ${filePath} 失败:`, error);
      // 继续处理下一个文件
    }
  }
  
  console.log(`批量处理完成，总共处理 ${allResults.length} 个项目`);
  
  return allResults;
}
