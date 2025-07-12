import { loadConfig, loadPromptTemplate } from './src/config.js';
import { getJsonFiles, saveProcessedResults } from './src/fileUtils.js';
import { processAllFiles } from './src/processor.js';

// 主函数
async function main() {
  try {
    console.log('🚀 开始处理数据...');
    
    // 加载配置和模板
    console.log('📝 加载配置文件...');
    const config = await loadConfig();
    const template = await loadPromptTemplate();
    
    console.log(`✓ 配置加载完成 - 模型: ${config.model}`);
    console.log(`✓ 提示模板: ${template.substring(0, 100)}...`);
    
    // 获取所有JSON文件
    console.log('📂 扫描数据文件...');
    const jsonFiles = await getJsonFiles('data');
    console.log(`✓ 找到 ${jsonFiles.length} 个JSON文件`);
    
    // 检查是否为完整模式
    const isFullMode = process.argv.includes('--full');
    const maxItemsPerFile = isFullMode ? undefined : 10;
    
    if (isFullMode) {
      console.log('🔥 运行完整模式（处理所有数据）');
    } else {
      console.log(`🧪 运行演示模式（每个文件最多处理 ${maxItemsPerFile} 个项目）`);
      console.log('💡 使用 --full 参数运行完整模式');
    }
    
    // 批量处理所有文件
    const allResults = await processAllFiles(jsonFiles, template, config, {
      maxItemsPerFile,
      delayMs: 1000,
      saveIndividually: true
    });
    
    // 保存汇总结果
    if (allResults.length > 0) {
      const summaryFileName = isFullMode ? 'all_results_full.json' : 'all_results_demo.json';
      await saveProcessedResults(allResults, 'dist', summaryFileName);
    }
    
    console.log(`🎉 处理完成！总共处理了 ${allResults.length} 个项目`);
    console.log(`📁 结果保存在 dist 目录下`);
    
  } catch (error) {
    console.error('❌ 程序执行失败:', error);
    process.exit(1);
  }
}

// 运行主函数
main().catch(console.error);