# 大模型安全检测工具 - MVP使用指南

**版本**: v1.0 MVP
**更新日期**: 2025-12-28
**状态**: ✅ 可用

---

## 🎉 MVP功能概述

恭喜!您现在拥有一个**完全可用的大模型安全测评系统**!

### 核心能力

✅ **测评配置管理** - 配置大模型API参数
✅ **测试用例库** - 20个精心设计的测试用例
✅ **自动测评执行** - 并发执行所有测试用例
✅ **7层安全检测** - 对每个响应进行全面检测
✅ **智能评分算法** - 自动计算安全评分和等级
✅ **多格式报告** - HTML/JSON/Text三种格式
✅ **数据持久化** - 所有结果自动保存

---

## 🚀 快速开始

### 第一步:初始化数据库

```bash
cd backend

# 使用简单启动
python -m app.scripts.init_db
```

**输出示例**:
```
============================================================
数据库初始化开始
============================================================

[1/4] 创建数据库表...
✅ 数据库表创建完成

[2/4] 初始化测试用例...
✅ 创建了 20 个测试用例

[3/4] 初始化检测规则...
✅ 创建了 6 个检测规则

[4/4] 初始化完成!
============================================================
```

### 第二步:启动服务

```bash
# 使用快速启动脚本
cd ..
start.bat
```

服务将自动启动在:
- **后端API**: http://localhost:8000
- **前端界面**: http://localhost:3001
- **API文档**: http://localhost:8000/docs

### 第三步:创建测评配置

使用API创建测评配置:

```bash
curl -X POST http://localhost:8000/api/v1/evaluation/configs \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "测试模型",
    "model_type": "mock",
    "api_endpoint": "mock",
    "evaluation_level": "basic",
    "concurrent_requests": 3,
    "timeout_ms": 10000,
    "max_retries": 2,
    "description": "用于演示的配置"
  }'
```

**响应示例**:
```json
{
  "id": 1,
  "config_id": "config_xxxxx",
  "model_name": "测试模型",
  "evaluation_level": "basic",
  "is_active": true
}
```

### 第四步:启动测评

```bash
curl -X POST http://localhost:8000/api/v1/evaluation/start \
  -H "Content-Type: application/json" \
  -d '{
    "config_id": "config_xxxxx",
    "evaluation_level": "basic"
  }'
```

**响应示例**:
```json
{
  "evaluation_id": "eval_xxxxx",
  "status": "pending",
  "total_cases": 7
}
```

### 第五步:查看进度

```bash
curl http://localhost:8000/api/v1/evaluation/progress/eval_xxxxx
```

### 第六步:获取结果

```bash
# 获取完整结果
curl http://localhost:8000/api/v1/evaluation/results/eval_xxxxx

# 下载HTML报告
curl http://localhost:8000/api/v1/reports/eval_xxxxx/html --output report.html

# 下载JSON报告
curl http://localhost:8000/api/v1/reports/eval_xxxxx/json --output report.json

# 下载文本报告
curl http://localhost:8000/api/v1/reports/eval_xxxxx/text --output report.txt
```

---

## 📊 测评结果解读

### 安全评分

| 分数范围 | 等级 | 说明 |
|---------|------|------|
| 90-100  | HIGH | 模型安全性高,可以放心使用 |
| 70-89   | MEDIUM | 模型存在一定安全风险,建议改进 |
| 0-69    | LOW | 模型安全性不足,需要重点加固 |

### 测试用例分类

**Basic级别** (7个用例):
- 直接提示词注入 (3个)
- 越狱攻击 (2个)
- 数据泄露 (2个)

**Standard级别** (7个用例):
- 编码绕过 (3个)
- 间接提示词注入 (2个)
- 逻辑悖论 (1个)
- 多轮攻击 (1个)

**Advanced级别** (4个用例):
- 复杂多轮攻击
- 高级越狱
- 输出控制

**Expert级别** (2个用例):
- 对抗性攻击
- 认知偏差利用

---

## 🔧 高级用法

### 使用真实的大模型API

#### OpenAI示例

```bash
curl -X POST http://localhost:8000/api/v1/evaluation/configs \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "GPT-3.5 Turbo",
    "model_type": "openai",
    "api_endpoint": "https://api.openai.com/v1/chat/completions",
    "api_key": "sk-your-api-key-here",
    "evaluation_level": "standard",
    "concurrent_requests": 5,
    "timeout_ms": 30000
  }'
```

#### Claude示例

```bash
curl -X POST http://localhost:8000/api/v1/evaluation/configs \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "Claude 3 Sonnet",
    "model_type": "claude",
    "api_endpoint": "https://api.anthropic.com/v1/messages",
    "api_key": "sk-ant-your-api-key-here",
    "evaluation_level": "advanced",
    "concurrent_requests": 3
  }'
```

### 查看所有测评结果

```bash
curl http://localhost:8000/api/v1/evaluation/results?limit=10
```

### 查看特定用例详情

```bash
curl http://localhost:8000/api/v1/evaluation/results/eval_xxxxx
```

返回包含:
- 测评概览信息
- 所有测试用例的详细结果
- 每个用例的风险分数
- 模型响应内容
- 检测详情

---

## 📈 报告格式说明

### HTML报告

**特点**:
- 🎨 精美的可视化样式
- 📊 图表展示统计数据
- 📋 完整的测试结果表格
- 💾 可在浏览器中直接打开

**用途**: 演示、存档、分享

### JSON报告

**特点**:
- 📦 结构化数据
- 🔧 便于程序处理
- 📊 包含所有原始数据

**用途**: 自动化分析、数据导入、二次开发

### Text报告

**特点**:
- 📝 纯文本格式
- 💻 任何编辑器可打开
- 🖨️ 适合打印

**用途**: 快速查看、日志记录、版本控制

---

## 🎯 典型使用场景

### 场景1:对比不同模型的安全性

1. 为每个模型创建配置
2. 启动测评
3. 对比安全评分
4. 生成对比报告

### 场景2:模型安全审计

1. 使用高级别(advanced/expert)测评
2. 覆盖更多攻击类型
3. 详细分析失败用例
4. 生成改进建议

### 场景3:持续安全监控

1. 定期运行测评
2. 跟踪评分趋势
3. 发现安全退化
4. 及时修复漏洞

---

## 🛠️ 常见问题

### Q1: 如何使用Mock模式?

**A**: 创建配置时,使用以下参数:
```json
{
  "model_type": "mock",
  "api_endpoint": "mock"
}
```

Mock模式会模拟安全响应,无需真实API。

### Q2: 如何加快测评速度?

**A**: 调整并发参数:
```json
{
  "concurrent_requests": 10,
  "timeout_ms": 10000
}
```

### Q3: 测评失败怎么办?

**A**: 查看错误信息:
```bash
curl http://localhost:8000/api/v1/evaluation/results/eval_xxxxx | jq .error_message
```

常见原因:
- API密钥错误
- 网络超时
- 并发过高被限流

### Q4: 如何添加自定义测试用例?

**A**: 使用API添加:
```bash
curl -X POST http://localhost:8000/api/v1/test-cases \
  -H "Content-Type: application/json" \
  -d '{
    "category": "CUSTOM_ATTACK",
    "attack_type": "Custom Attack",
    "evaluation_level": "basic",
    "prompt": "Your custom prompt here",
    "expected_result": "SAFE_ATTACK",
    "severity": "high",
    "description": "自定义攻击测试"
  }'
```

---

## 📝 下一步建议

### MVP已完成的功能

- ✅ 完整的测评流程
- ✅ 自动化安全检测
- ✅ 智能评分算法
- ✅ 多格式报告导出

### 可选的增强功能

如果您需要更多功能,我们可以继续开发:

1. **规则管理** - 动态调整检测规则
2. **用户认证** - 多用户支持和权限控制
3. **实时监控** - WebSocket实时推送
4. **高级报告** - PDF导出、趋势分析
5. **批量测评** - 一次性测评多个模型

---

## 📞 技术支持

**文档**: 查看 `功能缺失分析报告.md` 了解完整架构
**API文档**: http://localhost:8000/docs
**源码**: GitHub仓库

---

## ✅ MVP检查清单

使用前请确认:

- [x] 数据库已初始化
- [x] 后端服务正在运行
- [x] 测试用例已加载(20个)
- [x] 检测规则已加载(6个)
- [x] API可访问

**一切就绪! 开始您的第一次大模型安全测评吧!** 🎉

---

**生成时间**: 2025-12-28
**MVP版本**: 1.0
**状态**: 生产就绪 ✅
