# API替换映射表

## 用户信息管理

| API端点 | 原内存操作 | 新数据库操作 | 状态 |
|---------|----------|------------|------|
| GET /api/v1/user/info | users_db.get() | db.get_user_from_db() | ⏳ 待替换 |
| PUT /api/v1/user/info | users_db[user_id].update() | db.update_user_in_db() | ⏳ 待替换 |
| POST /api/v1/user/change-password | users_db[user_id]['password'] | db.update_user_in_db() | ⏳ 待替换 |
| GET /api/v1/user/account | users_db.get() | db.get_user_from_db() | ⏳ 待替换 |
| PUT /api/v1/user/account | users_db[user_id].update() | db.update_user_in_db() | ⏳ 待替换 |

## 账单订单

| API端点 | 原内存操作 | 新数据库操作 | 状态 |
|---------|----------|------------|------|
| GET /api/v1/user/bills | bills_db.values() | db.get_user_orders_from_db() + 查询bills表 | ⏳ 待替换 |
| POST /api/v1/user/recharge | 创建bills_db记录 | db.create_order_in_db() | ⏳ 待替换 |

## 实名认证

| API端点 | 原内存操作 | 新数据库操作 | 状态 |
|---------|----------|------------|------|
| GET /api/v1/user/verify/status | verifications_db.get() | 查询verifications表 | ⏳ 待替换 |
| GET /api/v1/user/verify | verifications_db.get() | 查询verifications表 | ⏳ 待替换 |
| POST /api/v1/user/verify | 创建verifications_db记录 | 插入verifications表 | ⏳ 待替换 |

## 套餐订阅

| API端点 | 原内存操作 | 新数据库操作 | 状态 |
|---------|----------|------------|------|
| GET /api/v1/user/packages | packages_db.values() | db.get_all_packages_from_db() | ⏳ 待替换 |
| GET /api/v1/user/subscription/overview | subscription_db.get() | db.get_user_subscription_from_db() | ⏳ 待替换 |
| POST /api/v1/user/packages/subscribe | 创建subscription_db记录 | db.create_subscription_in_db() | ⏳ 待替换 |

## 使用记录

| API端点 | 原内存操作 | 新数据库操作 | 状态 |
|---------|----------|------------|------|
| GET /api/v1/user/usage | usage_records_db | db.get_user_usage_records_from_db() | ⏳ 待替换 |
| GET /api/v1/user/api-logs | usage_records_db | db.get_user_usage_records_from_db() | ⏳ 待替换 |
| GET /api/v1/user/api-logs/stats | 统计usage_records_db | db.get_detection_usage_stats_from_db() | ⏳ 待替换 |
| GET /api/v1/user/api-logs/{log_id} | usage_records_db查找 | db.get_user_usage_records_from_db() | ⏳ 待替换 |

## 工单系统

| API端点 | 原内存操作 | 新数据库操作 | 状态 |
|---------|----------|------------|------|
| GET /api/v1/user/tickets | tickets_db.values() | db.get_user_tickets_from_db() | ⏳ 待替换 |
| POST /api/v1/user/tickets | 创建tickets_db记录 | db.create_ticket_in_db() | ⏳ 待替换 |
| GET /api/v1/user/tickets/{ticket_id} | tickets_db.get() | 查询tickets表 | ⏳ 待替换 |
| PUT /api/v1/user/tickets/{ticket_id} | tickets_db[id].update() | db.update_ticket_in_db() | ⏳ 待替换 |

## 系统设置

| API端点 | 原内存操作 | 新数据库操作 | 状态 |
|---------|----------|------------|------|
| GET /api/v1/user/settings | settings_db | db.get_all_settings_from_db() | ⏳ 待替换 |
| PUT /api/v1/user/settings | settings_db[key] = value | db.set_setting_in_db() | ⏳ 待替换 |

## API项目管理（已部分完成）

| API端点 | 原内存操作 | 新数据库操作 | 状态 |
|---------|----------|------------|------|
| GET /api/v1/user/projects | api_keys_db查询 | 查询api_keys表 | ✅ 已有API |
| POST /api/v1/user/projects | 创建api_keys_db记录 | 插入api_keys表 | ✅ 已有API |
| PUT /api/v1/user/projects/{key_id} | 更新api_keys_db | 更新api_keys表 | ✅ 已有API |
| DELETE /api/v1/user/projects/{key_id} | 删除api_keys_db | 删除api_keys表记录 | ✅ 已有API |
| POST /api/v1/user/projects/{key_id}/regenerate | 更新api_keys_db的key | 更新api_keys表 | ✅ 已有API |

## 管理员API

| API端点 | 原内存操作 | 新数据库操作 | 状态 |
|---------|----------|------------|------|
| GET /api/v1/auth/admin/users | list(users_db.values()) | db.get_all_users_from_db() | ✅ 已替换 |
| PATCH /api/v1/auth/admin/users/{user_id}/quota | users_db[id].update() | db.update_user_in_db() | ✅ 已替换 |

## 检测API（已集成数据库记录）

| API端点 | 原内存操作 | 新数据库操作 | 状态 |
|---------|----------|------------|------|
| POST /api/v1/detection/detect | - | 记录到api_call_logs表 | ✅ 已集成 |
| POST /api/v1/detection/batch | - | 记录到api_call_logs表 | ✅ 已集成 |

## 优先级说明

### P0 - 核心功能（必须替换）
- GET /api/v1/user/info - 用户信息
- PUT /api/v1/user/info - 更新用户信息
- POST /api/v1/user/change-password - 修改密码
- GET /api/v1/user/packages - 套餐列表
- POST /api/v1/user/packages/subscribe - 订阅套餐
- GET /api/v1/user/subscription/overview - 订阅概览

### P1 - 重要功能（应该替换）
- GET /api/v1/user/bills - 账单
- GET /api/v1/user/usage - 使用记录
- GET /api/v1/user/tickets - 工单列表
- POST /api/v1/user/tickets - 创建工单
- GET /api/v1/user/verify/status - 认证状态

### P2 - 辅助功能（可以稍后）
- POST /api/v1/user/verify - 提交认证
- GET /api/v1/user/api-logs - API日志
- GET /api/v1/user/settings - 系统设置

## 批量替换策略

1. **第一阶段**: P0核心功能（用户信息、套餐订阅）
2. **第二阶段**: P1重要功能（账单、工单、使用记录）
3. **第三阶段**: P2辅助功能（认证、日志、设置）

每个阶段替换后进行测试，确保功能正常。
