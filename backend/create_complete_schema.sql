-- 完整的数据库Schema - 包含所有用户数据表
-- 执行此脚本前请确保已备份重要数据

-- 1. 订单表
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    order_no VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(255) NOT NULL,
    package_id VARCHAR(255),
    type VARCHAR(50) NOT NULL,  -- 'purchase', 'recharge', 'subscription'
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- 'pending', 'paid', 'cancelled', 'refunded'
    payment_method VARCHAR(100),
    payment_time TIMESTAMP,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_create_time ON orders(create_time);

-- 2. 套餐表
CREATE TABLE IF NOT EXISTS packages (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,  -- 'basic', 'professional', 'enterprise'
    quota_amount INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER,
    features TEXT,  -- JSON格式存储特性列表
    status VARCHAR(50) NOT NULL DEFAULT 'active',  -- 'active', 'inactive'
    sort_order INTEGER NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_packages_type ON packages(type);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);

-- 3. 用户使用记录表
CREATE TABLE IF NOT EXISTS usage_records (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    api_key_id VARCHAR(255),
    request_type VARCHAR(100) NOT NULL,  -- 'detection', 'batch_detection', 'analysis'
    request_text TEXT,
    response_size INTEGER,
    risk_score DECIMAL(5, 4),
    is_compliant BOOLEAN,
    processing_time_ms INTEGER,
    ip_address VARCHAR(50),
    user_agent TEXT,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_create_time ON usage_records(create_time);
CREATE INDEX IF NOT EXISTS idx_usage_records_request_type ON usage_records(request_type);

-- 4. 检测使用统计表（简化版）
CREATE TABLE IF NOT EXISTS detection_usage (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    total_calls INTEGER NOT NULL DEFAULT 0,
    compliant_calls INTEGER NOT NULL DEFAULT 0,
    risky_calls INTEGER NOT NULL DEFAULT 0,
    avg_risk_score DECIMAL(5, 4),
    total_processing_time_ms BIGINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_detection_usage_user_id ON detection_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_usage_date ON detection_usage(date);

-- 5. 用户订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    package_id VARCHAR(255) NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',  -- 'active', 'expired', 'cancelled'
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    quota_amount INTEGER NOT NULL,
    remaining_quota INTEGER NOT NULL,
    price DECIMAL(10, 2),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- 6. 工单表
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(255) PRIMARY KEY,
    ticket_no VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- 'technical', 'billing', 'feature', 'bug'
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',  -- 'low', 'medium', 'high', 'urgent'
    subject VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open',  -- 'open', 'in_progress', 'resolved', 'closed'
    assignee_id VARCHAR(255),
    resolution TEXT,
    resolution_time TIMESTAMP,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_create_time ON tickets(create_time);

-- 7. 系统设置表
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'string',  -- 'string', 'number', 'boolean', 'json'
    category VARCHAR(100),  -- 'system', 'detection', 'notification', 'security'
    is_public BOOLEAN NOT NULL DEFAULT FALSE,  -- 是否允许前端访问
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_is_public ON settings(is_public);

-- 8. 实名认证缓存表（可选，用于加速查询）
CREATE TABLE IF NOT EXISTS verifications_cache (
    user_id VARCHAR(255) PRIMARY KEY,
    verification_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    real_name VARCHAR(255),
    company VARCHAR(255),
    cache_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (verification_id) REFERENCES verifications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_verifications_cache_status ON verifications_cache(status);

-- 插入默认套餐数据
INSERT INTO packages (id, name, description, type, quota_amount, price, duration_days, features, status, sort_order) VALUES
('pkg_basic', '基础版', '适合个人开发者和初创企业', 'basic', 10000, 99.00, 30, '["基础检测功能", "10,000次调用", "邮件支持"]', 'active', 1),
('pkg_professional', '专业版', '适合成长型团队和企业', 'professional', 100000, 499.00, 30, '["全功能检测", "100,000次调用", "优先技术支持", "自定义规则"]', 'active', 2),
('pkg_enterprise', '企业版', '适合大型企业和高流量场景', 'enterprise', 1000000, 1999.00, 30, '["无限检测", "1,000,000次调用", "24/7专属支持", "私有化部署", "定制开发"]', 'active', 3)
ON CONFLICT (id) DO NOTHING;

-- 插入默认系统设置
INSERT INTO settings (key, value, description, type, category, is_public) VALUES
('system.maintenance_mode', 'false', '系统维护模式', 'boolean', 'system', false),
('system.max_request_size', '10485760', '最大请求大小（字节）', 'number', 'system', false),
('detection.default_threshold', '0.5', '默认检测阈值', 'number', 'detection', false),
('detection.enable_semantic', 'true', '启用语义分析', 'boolean', 'detection', false),
('notification.email_enabled', 'true', '启用邮件通知', 'boolean', 'notification', false),
('security.rate_limit_enabled', 'true', '启用速率限制', 'boolean', 'security', false),
('security.rate_limit_per_minute', '60', '每分钟请求限制', 'number', 'security', false)
ON CONFLICT (key) DO NOTHING;
