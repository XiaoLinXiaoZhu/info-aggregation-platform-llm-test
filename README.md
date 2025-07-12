# LLM Data Processor

这是一个模块化的LLM数据处理工具，用于批量处理JSON数据文件并通过LLM API生成结构化结果。

## 项目结构

```
playground/
├── src/                    # 源代码模块
│   ├── config.ts          # 配置管理模块
│   ├── template.ts        # 模板处理模块
│   ├── llm.ts            # LLM API调用模块
│   ├── fileUtils.ts      # 文件操作模块
│   └── processor.ts      # 核心处理器模块
├── data/                  # 输入数据目录
├── dist/                  # 输出结果目录
├── main.ts               # 主程序入口
├── test.ts               # 测试程序
├── llm.config.json       # LLM配置文件
├── llm.prompt.cfg        # 提示模板文件
└── package.json          # 项目配置
```

## 功能模块

### 1. 配置管理 (src/config.ts)
- 读取LLM配置文件
- 读取提示模板文件
- 类型定义

### 2. 模板处理 (src/template.ts)
- 填充模板占位符
- 提取LLM响应结果
- 格式化输出

### 3. LLM调用 (src/llm.ts)
- 调用LLM API
- 错误处理
- 请求延迟控制

### 4. 文件操作 (src/fileUtils.ts)
- 读取数据文件
- 保存处理结果
- 目录管理

### 5. 核心处理器 (src/processor.ts)
- 处理单个数据项
- 批量处理文件
- 结果整合

## 使用方法

### 1. 运行测试（处理2个项目）
```bash
bun run test
```

### 2. 运行演示模式（每个文件处理3个项目）
```bash
bun run start
```

### 3. 运行完整模式（处理所有数据）
```bash
bun run start:full
```

### 4. 清理输出目录
```bash
bun run clean
```

## 输出格式

处理结果将保存为JSON格式，每个项目包含以下结构：

```json
{
  "original": {
    "spider": "数据源",
    "url": "原始URL",
    "title": "标题",
    "content": "内容",
    "time": "时间"
  },
  "reply": {
    "context": "LLM完整响应",
    "result": "提取的结果",
    "result_formated": "格式化后的结果",
    "time": "处理时间",
    "llmConfig": {
      "model": "使用的模型"
    }
  }
}
```

## 配置说明

### LLM配置 (llm.config.json)
```json
{
  "model": "模型名称",
  "base_url": "API基础URL",
  "api_key": "API密钥"
}
```

### 提示模板 (llm.prompt.cfg)
使用 `{ 字段名 }` 作为占位符，例如：
```
这是一段测试文本 { spider } spider 字段应该被替换为每一个项目的对应字段
```

## 注意事项

1. 确保 `data` 目录下有JSON格式的数据文件
2. 配置正确的LLM API信息
3. 根据API限制调整请求延迟
4. 结果自动保存到 `dist` 目录下
