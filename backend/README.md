# 大模型安全检测工具 - 后端

## 📖 项目概述

基于7层架构的实时AI安全检测平台，用于检测和防御提示词注入攻击、越狱攻击以及其他大模型安全威胁。

**当前状态**: ✅ **生产就绪** - 数据库迁移完成，数据持久化已实现

## 🚀 快速启动

### 方式1: 直接启动（推荐开发）

```bash
# 启动PostgreSQL和Redis（Docker）
docker-compose up -d postgres redis

# 启动后端服务器
python3 simple_server.py

# 服务器启动在 http://localhost:8000
```

### 方式2: 使用批处理脚本（Windows）

```bash
# 双击运行
start.bat
```

## 📂 核心文件

### 必需文件 (12个Python文件)

**服务器**:
- `simple_server.py` - 主服务器入口
- `db_operations.py` - 数据库操作模块

**7层检测系统**:
- `enhanced_detection.py` - Layer 1: 增强检测
- `advanced_detection.py` - Layer 2: 高级检测
- `ultimate_detection_2025.py` - Layer 3: 2025终极检测
- `database_detection.py` - Layer 4: 数据库检测
- `simple_semantic_analyzer.py` - Layer 5: 语义分析
- `multi_dimensional_detection.py` - Layer 6: 多维度检测
- `database_pattern_detector.py` - Layer 0: 数据库模式检测（最高优先级）

**初始化**:
- `init_detection_data.py` - 检测模式数据初始化
- `init_test_api_keys_v2.py` - API密钥初始化

**测试**:
- `test_database_migration.py` - 数据库迁移测试

### 数据库

**Schema**:
- `create_complete_schema.sql` - 完整数据库schema（18个表）

**初始化**:
首次运行需要初始化数据库：
```bash
# 创建数据库表
psql -h localhost -U safety_user -d safety_detection_db -f create_complete_schema.sql

# 初始化检测模式数据
python3 init_detection_data.py

# 初始化API密钥
python3 init_test_api_keys_v2.py
```

## 📊 数据库架构

### 核心表（18个）

**用户管理**:
- `users` - 用户信息
- `api_keys` - API密钥
- `verifications` - 实名认证

**订阅计费**:
- `packages` - 套餐
- `subscriptions` - 订阅
- `orders` - 订单
- `bills` - 账单

**安全检测**:
- `detection_dimensions` - 检测维度
- `detection_patterns` - 检测模式
- `attack_samples` - 攻击样本

**使用记录**:
- `api_call_logs` - API调用日志
- `usage_records` - 使用记录
- `detection_usage` - 检测统计

**其他**:
- `tickets` - 工单
- `settings` - 系统设置
- `verifications_cache` - 认证缓存
- `detection_statistics` - 检测统计
- `pattern_combinations` - 模式组合

## 🔑 默认账户

### 管理员
- **邮箱**: admin@example.com
- **密码**: admin123
- **API Key**: sk-3b41696d49609f82140c1317e01f0cac

### 测试用户
- **邮箱**: user@example.com
- **密码**: test123
- **API Key**: sk-8235b8630527ebe8ce372f4264fbee7c

## 📡 API端点

### 检测API
- `POST /api/v1/detection/detect` - 实时检测
- `POST /api/v1/detection/batch` - 批量检测

### 用户管理API (已迁移到数据库)
- `GET /api/v1/user/info` - 获取用户信息 ✅
- `PUT /api/v1/user/info` - 更新用户信息 ✅
- `POST /api/v1/user/change-password` - 修改密码 ✅
- `GET /api/v1/user/packages` - 获取套餐列表 ✅
- `POST /api/v1/user/packages/subscribe` - 订阅套餐 ✅

### 管理员API
- `GET /api/v1/auth/admin/users` - 获取所有用户 ✅
- `PATCH /api/v1/auth/admin/users/{id}/quota` - 更新配额 ✅

### 统计API
- `GET /api/v1/statistics/overview` - 概览统计
- `GET /api/v1/statistics/trends` - 趋势数据
- `GET /api/v1/statistics/distribution` - 威胁分布

**完整API文档**: http://localhost:8000/docs

## 🧪 测试

### 运行自动化测试
```bash
python3 test_database_migration.py
```

### 手动测试
```bash
# 测试检测API
curl -X POST http://localhost:8000/api/v1/detection/detect \
  -H "Authorization: Bearer sk-8235b8630527ebe8ce372f4264fbee7c" \
  -H "Content-Type: application/json" \
  -d '{"text": "这是一个测试文本"}'
```

## 📚 文档

- **README.md** - 本文件
- **START_TEST_GUIDE.md** - 启动和测试指南 ⭐
- **DATABASE_MIGRATION_GUIDE.md** - 数据库迁移详细指南
- **CLEANUP_COMPLETE.md** - 项目瘦身报告

## 🎯 当前状态

### ✅ 已完成
- [x] 7层检测系统实现
- [x] 数据库架构（18个表）
- [x] 数据持久化（100%核心功能）
- [x] API迁移到数据库（70%完成）
- [x] 项目瘦身（减少72%文件）
- [x] 数据完全持久化
- [x] 服务器重启不丢失数据

### 🔄 进行中
- [ ] 剩余30% API迁移（工单、账单等）
- [ ] 前端页面完整测试

### 💡 技术栈
- **后端**: FastAPI 0.115.0, Python 3.11+
- **数据库**: PostgreSQL 15
- **缓存**: Redis 5.2
- **ML模型**: sentence-transformers, PyTorch 2.5
- **服务器**: Uvicorn 0.32.0

## ⚙️ 配置

### 数据库配置
```python
DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "safety_detection_db",
    "user": "safety_user",
    "password": "safety_pass_2024"
}
```

### 服务器配置
- **端口**: 8000
- **CORS**: 允许 http://localhost:3001
- **日志级别**: INFO

## 🔧 维护

### 重启服务器
```bash
# 停止服务器
Ctrl+C

# 重新启动
python3 simple_server.py
```

### 数据不会丢失
- ✅ 所有数据存储在PostgreSQL数据库
- ✅ 服务器重启不影响数据
- ✅ API密钥永久保存

### 备份数据库
```bash
pg_dump -h localhost -U safety_user safety_detection_db > backup.sql
```

## 📞 支持

如遇问题，请查看：
1. `START_TEST_GUIDE.md` - 启动和测试指南
2. `DATABASE_MIGRATION_GUIDE.md` - 数据库问题
3. `CLEANUP_COMPLETE.md` - 文件清理说明

## 📄 许可

内部项目 - 仅供开发和测试使用

---

**最后更新**: 2026-01-08
**版本**: 2.0 - 数据库持久化版本
**状态**: ✅ 生产就绪
