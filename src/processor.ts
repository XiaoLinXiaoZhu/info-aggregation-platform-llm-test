import { LLMConfig, DataItem, ProcessedItem, ProcessStats } from './config.js';
import { fillTemplate, extractResult } from './template.js';
import { callLLM, delay } from './llm.js';
import { loadDataFile, saveFileResults } from './fileUtils.js';
import * as path from 'path';

// 处理单个数据项
export async function processDataItem(
  item: DataItem,
  template: string,
  config: LLMConfig,
  itemIndex: number,
  stats: ProcessStats
): Promise<ProcessedItem> {
  const itemStartTime = Date.now();
  console.log(`\n[${itemIndex + 1}] 开始处理: ${item.title?.substring(0, 50)}...`);
  
  try {
    // 填充模板
    const filledPrompt = fillTemplate(template, item);
    const inputChars = filledPrompt.length;
    console.log(`  📝 输入字符数: ${inputChars.toLocaleString()}`);
    
    // 调用 LLM
    const { content: response, duration, inputChars: actualInputChars, outputChars } = await callLLM(config, filledPrompt);
    
    // 提取结果
    const { result, result_formated } = extractResult(response);
    
    // 更新统计信息
    stats.totalInputChars += actualInputChars;
    stats.totalOutputChars += outputChars;
    stats.successItems++;
    
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
    
    const itemDuration = Date.now() - itemStartTime;
    console.log(`  ✅ 处理完成 (${itemDuration}ms)`);
    console.log(`  📤 输出字符数: ${outputChars.toLocaleString()}`);
    console.log(`  ⏱️  LLM响应时间: ${duration}ms`);
    console.log(`  📊 总耗时: ${itemDuration}ms`);
    
    return processedItem;
  } catch (error) {
    stats.failedItems++;
    const itemDuration = Date.now() - itemStartTime;
    console.log(`  ❌ 处理失败 (${itemDuration}ms): ${error}`);
    throw error;
  }
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
): Promise<{ results: ProcessedItem[]; stats: ProcessStats }> {
  const { maxItems, delayMs = 1000, saveIndividually = true } = options;
  
  console.log(`\n🔄 === 开始处理文件: ${path.basename(filePath)} ===`);
  
  // 初始化统计信息
  const stats: ProcessStats = {
    totalItems: 0,
    successItems: 0,
    failedItems: 0,
    totalInputChars: 0,
    totalOutputChars: 0,
    totalDuration: 0,
    averageResponseTime: 0,
    startTime: Date.now(),
    endTime: 0
  };
  
  // 加载数据
  const dataItems = await loadDataFile(filePath);
  const itemsToProcess = maxItems ? dataItems.slice(0, maxItems) : dataItems;
  
  stats.totalItems = itemsToProcess.length;
  
  console.log(`📋 文件包含 ${dataItems.length.toLocaleString()} 个数据项，将处理 ${itemsToProcess.length.toLocaleString()} 个`);
  
  const results: ProcessedItem[] = [];
  const responseTimes: number[] = [];
  
  // 顺序处理每个数据项
  for (let i = 0; i < itemsToProcess.length; i++) {
    try {
      const item = itemsToProcess[i];
      const processedItem = await processDataItem(item, template, config, i, stats);
      results.push(processedItem);
      
      // 添加延迟避免请求过快
      if (i < itemsToProcess.length - 1) {
        console.log(`⏳ 等待 ${delayMs}ms...`);
        await delay(delayMs);
      }
    } catch (error) {
      console.error(`❌ 处理第 ${i + 1} 个项目时出错:`, error);
      // 继续处理下一个项目
    }
  }
  
  // 完成统计
  stats.endTime = Date.now();
  stats.totalDuration = stats.endTime - stats.startTime;
  stats.averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;
  
  // 保存当前文件的结果
  if (saveIndividually && results.length > 0) {
    await saveFileResults(results, path.basename(filePath));
  }
  
  // 打印文件处理总结
  console.log(`\n📊 === 文件 ${path.basename(filePath)} 处理完成 ===`);
  console.log(`✅ 成功处理: ${stats.successItems}/${stats.totalItems} 个项目`);
  console.log(`❌ 失败项目: ${stats.failedItems} 个`);
  console.log(`📝 总输入字符数: ${stats.totalInputChars.toLocaleString()}`);
  console.log(`📤 总输出字符数: ${stats.totalOutputChars.toLocaleString()}`);
  console.log(`⏱️  总耗时: ${(stats.totalDuration / 1000).toFixed(2)}秒`);
  console.log(`⚡ 平均每项耗时: ${(stats.totalDuration / stats.totalItems / 1000).toFixed(2)}秒`);
  
  return { results, stats };
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
): Promise<{ results: ProcessedItem[]; overallStats: ProcessStats }> {
  const allResults: ProcessedItem[] = [];
  const allStats: ProcessStats[] = [];
  const overallStartTime = Date.now();
  
  console.log(`\n🚀 === 开始批量处理 ${filePaths.length} 个文件 ===`);
  
  for (let fileIndex = 0; fileIndex < filePaths.length; fileIndex++) {
    const filePath = filePaths[fileIndex];
    console.log(`\n📁 [${fileIndex + 1}/${filePaths.length}] 处理文件: ${path.basename(filePath)}`);
    
    try {
      const { results, stats } = await processDataFile(filePath, template, config, {
        maxItems: options.maxItemsPerFile,
        delayMs: options.delayMs,
        saveIndividually: options.saveIndividually
      });
      allResults.push(...results);
      allStats.push(stats);
    } catch (error) {
      console.error(`❌ 处理文件 ${filePath} 失败:`, error);
      // 继续处理下一个文件
    }
  }
  
  // 计算总体统计
  const overallStats: ProcessStats = {
    totalItems: allStats.reduce((sum, stat) => sum + stat.totalItems, 0),
    successItems: allStats.reduce((sum, stat) => sum + stat.successItems, 0),
    failedItems: allStats.reduce((sum, stat) => sum + stat.failedItems, 0),
    totalInputChars: allStats.reduce((sum, stat) => sum + stat.totalInputChars, 0),
    totalOutputChars: allStats.reduce((sum, stat) => sum + stat.totalOutputChars, 0),
    totalDuration: Date.now() - overallStartTime,
    averageResponseTime: allStats.length > 0 
      ? allStats.reduce((sum, stat) => sum + stat.averageResponseTime, 0) / allStats.length 
      : 0,
    startTime: overallStartTime,
    endTime: Date.now()
  };
  
  // 打印总体统计报告
  console.log(`\n🎉 === 批量处理完成 ===`);
  console.log(`📁 处理文件数: ${filePaths.length}`);
  console.log(`📊 总项目数: ${overallStats.totalItems.toLocaleString()}`);
  console.log(`✅ 成功处理: ${overallStats.successItems.toLocaleString()} 个`);
  console.log(`❌ 失败项目: ${overallStats.failedItems.toLocaleString()} 个`);
  console.log(`📈 成功率: ${((overallStats.successItems / overallStats.totalItems) * 100).toFixed(1)}%`);
  console.log(`📝 总输入字符数: ${overallStats.totalInputChars.toLocaleString()}`);
  console.log(`📤 总输出字符数: ${overallStats.totalOutputChars.toLocaleString()}`);
  console.log(`⏱️  总耗时: ${(overallStats.totalDuration / 1000 / 60).toFixed(2)} 分钟`);
  console.log(`⚡ 平均每项耗时: ${(overallStats.totalDuration / overallStats.totalItems / 1000).toFixed(2)} 秒`);
  console.log(`🔄 平均LLM响应时间: ${overallStats.averageResponseTime.toFixed(0)} ms`);
  
  return { results: allResults, overallStats };
}
