# 项目瘦身清理计划

## 📋 文件分类

### ✅ 必须保留（正在使用）

**核心服务器**:
- `simple_server.py` - 主服务器
- `db_operations.py` - 数据库操作模块

**检测模块** (被simple_server.py引用):
- `enhanced_detection.py`
- `advanced_detection.py`
- `ultimate_detection_2025.py`
- `database_detection.py`
- `simple_semantic_analyzer.py`
- `multi_dimensional_detection.py`
- `database_pattern_detector.py`

**数据库初始化**:
- `create_complete_schema.sql` - 完整数据库schema
- `init_detection_data.py` - 检测模式数据初始化

**测试和工具**:
- `test_database_migration.py` - 数据库迁移测试
- `init_test_api_keys_v2.py` - API密钥初始化

### ❌ 可以删除（冗余/过时）

#### 1. 重复的初始化脚本（保留v2版本）
- ❌ `init_test_api_keys.py` - 旧版本，已被v2替代
- ❌ `init_test_logs.py` - 一次性脚本，已执行完成
- ❌ `init_test_cases_db.py` - 旧版测试用例初始化
- ❌ `init_test_cases_sqlite.py` - SQLite版本，不再使用

#### 2. 临时测试文件
- ❌ `test_api_calls.py` - 临时测试
- ❌ `test_semantic.py` - 临时测试
- ❌ `test_database_detection.py` - 临时测试
- ❌ `test_multi_dimensional.py` - 临时测试
- ❌ `test_admin_api.py` - 临时测试
- ❌ `test_admin_verification_fix.py` - 临时测试
- ❌ `test_api_keys.py` - 临时测试
- ❌ `test_runner.py` - 临时测试

#### 3. 旧版app目录（未使用）
由于使用 `simple_server.py`，`app/` 目录下的完整FastAPI应用未使用：
- ❌ `app/` 整个目录（保留作为参考，但可以删除）

#### 4. 冗余文档（合并保留最重要的）
保留：
- ✅ `README.md` - 项目主文档
- ✅ `START_TEST_GUIDE.md` - 启动测试指南
- ✅ `DATABASE_MIGRATION_GUIDE.md` - 迁移指南

删除：
- ❌ `API_KEYS_FIX.md` - 已整合到迁移指南
- ❌ `DASHBOARD_DATA_FIX.md` - 已整合到迁移指南
- ❌ `API_REMAPPING_GUIDE.md` - 已整合到迁移指南
- ❌ `MIGRATION_COMPLETE.md` - 已整合到迁移指南
- ❌ `MULTI_DIMENSIONAL_DETECTION.md` - 临时文档
- ❌ `MODEL_LOCATION.md` - 临时文档
- ❌ `ATTACK_TEST_REPORT.md` - 临时文档
- ❌ `DATABASE_DETECTION_COMPLETE.md` - 临时文档
- ❌ `后端服务重启说明.md` - 过时文档
- ❌ `管理员权限修复说明.md` - 过时文档

#### 5. 其他临时文件
- ❌ `user_apis.py` - 未使用的API模块
- ❌ `patch_simple_server.py` - 未使用的补丁脚本
- ❌ `usercenter_api.py` - 旧版本API

#### 6. __pycache__ 目录
- ❌ `__pycache__/` - Python缓存

### 📊 清理统计

**总计可删除**: ~30个文件
**预计释放空间**: ~5-10MB
**清理后保留**: ~15个核心文件

## 🎯 清理步骤

1. 创建 `archived/` 目录存放备份文件
2. 移动冗余文件到 `archived/`
3. 删除 `__pycache__`
4. 验证项目正常运行
5. （可选）完全删除 `archived/`

## ⚠️ 注意事项

1. **不要删除**被 `simple_server.py` 引用的任何检测模块
2. **保留** `create_complete_schema.sql` 和 `init_detection_data.py`
3. **保留**最新的测试脚本 `test_database_migration.py`
4. **删除前先移动到archived**，以便需要时恢复
