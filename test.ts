import { loadConfig, loadPromptTemplate } from './src/config.js';
import { getJsonFiles, saveProcessedResults } from './src/fileUtils.js';
import { processDataFile } from './src/processor.js';

async function test() {
  try {
    console.log('🧪 开始测试处理流程...');
    
    const config = await loadConfig();
    const template = await loadPromptTemplate();
    
    console.log(`✓ 配置加载完成 - 模型: ${config.model}`);
    console.log(`✓ 提示模板: ${template}`);
    
    const jsonFiles = await getJsonFiles('data');
    
    if (jsonFiles.length === 0) {
      console.log('❌ 没有找到JSON数据文件');
      return;
    }
    
    const testFile = jsonFiles[0];
    console.log(`✓ 使用测试文件: ${testFile}`);
    
    console.log('🔄 开始测试处理...');
    const results = await processDataFile(testFile, template, config, {
      maxItems: 4,
      delayMs: 2000,
      saveIndividually: false
    });
    
    if (results.length > 0) {
      await saveProcessedResults(results, 'dist', 'test_results.json');
      
      console.log('\n📊 测试结果摘要:');
      results.forEach((item, index) => {
        console.log(`${index + 1}. 标题: ${item.original.title?.substring(0, 50)}...`);
        console.log(`   响应长度: ${item.reply.context.length} 字符`);
        console.log(`   结果类型: ${item.reply.result_formated.type}`);
        console.log(`   提取状态: ${item.reply.result_formated.extracted ? '成功' : '失败'}`);
        if (item.reply.result_formated.content) {
          const contentPreview = typeof item.reply.result_formated.content === 'object' 
            ? JSON.stringify(item.reply.result_formated.content).substring(0, 100)
            : String(item.reply.result_formated.content).substring(0, 100);
          console.log(`   内容预览: ${contentPreview}...`);
        }
        console.log('');
      });
    }
    
    console.log(`🎉 测试完成！处理了 ${results.length} 个项目`);
    console.log(`📁 结果保存在 dist/test_results.json`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

test().catch(console.error);
