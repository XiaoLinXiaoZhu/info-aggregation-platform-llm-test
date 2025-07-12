import * as fs from 'fs/promises';
import * as path from 'path';
import { DataItem, ProcessedItem } from './config.js';

// 读取数据文件
export async function loadDataFile(filePath: string): Promise<DataItem[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent) as DataItem[];
  } catch (error) {
    console.error(`读取数据文件失败: ${filePath}`, error);
    throw error;
  }
}

// 获取所有JSON文件
export async function getJsonFiles(dataDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dataDir);
    return files
      .filter(file => path.extname(file) === '.json')
      .map(file => path.join(dataDir, file));
  } catch (error) {
    console.error(`读取目录失败: ${dataDir}`, error);
    throw error;
  }
}

// 确保目录存在
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// 保存处理结果到JSON文件
export async function saveProcessedResults(
  results: ProcessedItem[], 
  outputDir: string = 'dist',
  fileName?: string
): Promise<string> {
  await ensureDir(outputDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFileName = fileName || `processed_results_${timestamp}.json`;
  const outputPath = path.join(outputDir, outputFileName);
  
  try {
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`结果已保存到: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('保存结果失败:', error);
    throw error;
  }
}

// 保存单个文件的处理结果
export async function saveFileResults(
  results: ProcessedItem[], 
  fileName: string,
  outputDir: string = 'dist'
): Promise<string> {
  const baseName = path.basename(fileName, path.extname(fileName));
  const outputFileName = `${baseName}_processed.json`;
  return await saveProcessedResults(results, outputDir, outputFileName);
}
