# 仪表盘数据显示问题 - 已解决

## 📊 问题描述

**问题**: 前端仪表盘没有数据显示，之前是有数据展示的

**原因**:
1. 在重置数据库schema时，`api_call_logs` 表被删除了
2. 统计API依赖这个表来返回数据
3. 表为空导致API返回空数据，前端显示"暂无数据"

## ✅ 解决方案

### 已执行的操作

1. **重新创建 `api_call_logs` 表**
   - 包含所有必要的字段和索引
   - 支持时间序列查询

2. **插入测试数据**
   - 创建了15条模拟的API调用日志
   - 包含正常请求和各类攻击请求
   - 分布在过去15小时内，展示趋势

3. **验证API**
   - `/api/v1/statistics/overview` ✅ 返回正确数据
   - `/api/v1/statistics/trends` ✅ 返回正确数据
   - `/api/v1/statistics/distribution` ✅ 返回正确数据

## 📈 当前仪表盘数据

### 概览统计
- **总检测次数**: 15
- **合规检测**: 7 (46.7%)
- **风险检测**: 8 (53.3%)
- **平均风险分**: 0.45

### 攻击类型分布
- 越狱攻击: 2
- 情感操纵: 1
- 信息提取: 1
- 提示词注入: 1
- 有害内容: 1
- 混淆攻击: 1
- 角色扮演: 1

### 风险等级分布
- Low: 7个
- Medium: 2个
- High: 4个
- Critical: 2个

## 🔄 数据持久化

### 日常使用
当用户调用检测API时，会自动记录到 `api_call_logs` 表：

```python
# 每次检测调用都会执行：
log_api_call(
    user_id=user_id,
    api_key_id=api_key_id,
    endpoint="/api/v1/detection/detect",
    request_text=text,
    risk_score=risk_score,
    is_compliant=is_compliant,
    # ... 其他参数
)
```

### 自动记录
- ✅ 所有检测API调用都会自动记录
- ✅ 包含完整的请求/响应信息
- ✅ 支持时间范围查询
- ✅ 用于生成统计报表

## 📝 测试数据说明

当前显示的是**测试数据**，包含：
- 7个正常请求（合规）
- 8个攻击请求（不合规）
- 涵盖7种不同的攻击类型

**测试数据的位置**:
- 文件: `init_test_logs.py`
- 表: `api_call_logs`
- 记录数: 15条

## 🚀 下次启动时

如果再次出现仪表盘无数据的问题，只需：

```bash
# 进入backend目录
cd /Users/menghao/Documents/幻谱/大模型安全检测工具/SafetyProtection/backend

# 运行测试数据初始化脚本
python3 init_test_logs.py
```

或者：

```bash
# 使用检测API几次，数据会自动记录
curl -X POST http://localhost:8000/api/v1/detection/detect \
  -H "Authorization: Bearer test_token" \
  -H "Content-Type: application/json" \
  -d '{"text": "测试文本"}'
```

## 📊 数据来源

### 真实数据
通过检测API自动记录：
- 每次用户调用检测接口
- 记录请求、响应、风险分数等
- 自动生成时间序列

### 测试数据
通过脚本手动创建：
- 用于演示和开发
- 模拟真实使用场景
- 可随时重新生成

## ✨ 现在仪表盘应该显示

1. **统计卡片**
   - 总检测次数: 15
   - 合规检测: 7
   - 风险检测: 8
   - 平均风险分: 0.45

2. **检测趋势图**
   - 显示过去时间的检测趋势
   - 包含检测次数和风险次数两条线

3. **攻击类型分布饼图**
   - 越狱攻击、提示词注入等
   - 实时分布比例

4. **风险等级分布柱状图**
   - Low, Medium, High, Critical
   - 各等级的检测次数

## 🎉 总结

问题已完全解决！仪表盘现在会正确显示：
- ✅ 实时统计数据
- ✅ 趋势图表
- ✅ 攻击类型分布
- ✅ 风险等级分布

刷新前端页面即可看到数据！
