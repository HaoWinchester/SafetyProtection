-- 检测模式数据库表结构
-- 用于存储10个维度的检测模式和攻击样本

-- 1. 维度表
CREATE TABLE IF NOT EXISTS detection_dimensions (
    id SERIAL PRIMARY KEY,
    dimension_name VARCHAR(50) UNIQUE NOT NULL,
    dimension_code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    risk_weight DECIMAL(3,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 检测模式表
CREATE TABLE IF NOT EXISTS detection_patterns (
    id SERIAL PRIMARY KEY,
    dimension_id INTEGER REFERENCES detection_dimensions(id),
    pattern_name VARCHAR(100) NOT NULL,
    pattern_type VARCHAR(20) NOT NULL, -- 'keyword', 'regex', 'semantic', 'structural'
    pattern_content TEXT NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    confidence DECIMAL(3,2) DEFAULT 0.70,
    is_case_sensitive BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    effectiveness_score DECIMAL(3,2), -- 实际检测效果评分
    false_positive_rate DECIMAL(3,2),
    detection_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100) -- 来源：OWASP, Academic, Community, Internal
);

-- 3. 攻击样本表
CREATE TABLE IF NOT EXISTS attack_samples (
    id SERIAL PRIMARY KEY,
    dimension_id INTEGER REFERENCES detection_dimensions(id),
    sample_name VARCHAR(100),
    sample_text TEXT NOT NULL,
    sample_type VARCHAR(50), -- 'direct', 'obfuscated', 'advanced', 'evasion'
    attack_variant VARCHAR(100), -- 变体名称，如 'DAN 2.0', 'Base64 Injection'
    is_verified BOOLEAN DEFAULT TRUE, -- 是否已验证为攻击
    difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard', 'expert'
    bypasses_defenses TEXT, -- JSON格式：绕过哪些防御
    success_rate DECIMAL(3,2), -- 成功率
    detected_by_patterns INTEGER[], -- 被哪些pattern检测到
    labels JSONB, -- 其他标签信息
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100),
    INDEX idx_dimension_sample (dimension_id),
    INDEX idx_sample_type (sample_type)
);

-- 4. 检测统计表
CREATE TABLE IF NOT EXISTS detection_statistics (
    id SERIAL PRIMARY KEY,
    dimension_id INTEGER REFERENCES detection_dimensions(id),
    pattern_id INTEGER REFERENCES detection_patterns(id),
    date DATE DEFAULT CURRENT_DATE,
    total_scans INTEGER DEFAULT 0,
    detections INTEGER DEFAULT 0,
    true_positives INTEGER DEFAULT 0,
    false_positives INTEGER DEFAULT 0,
    false_negatives INTEGER DEFAULT 0,
    avg_confidence DECIMAL(3,2),
    avg_detection_time_ms INTEGER,
    UNIQUE(dimension_id, pattern_id, date)
);

-- 5. 规则组合表（用于复杂的多模式检测）
CREATE TABLE IF NOT EXISTS pattern_combinations (
    id SERIAL PRIMARY KEY,
    combination_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logic_operator VARCHAR(10) DEFAULT 'AND', -- 'AND', 'OR', 'NOT'
    pattern_ids INTEGER[] NOT NULL,
    min_pattern_match INTEGER DEFAULT 1, -- 至少匹配多少个pattern
    severity VARCHAR(20) DEFAULT 'high',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_detection_patterns_active ON detection_patterns(is_active, dimension_id);
CREATE INDEX IF NOT EXISTS idx_attack_samples_verified ON attack_samples(is_verified, dimension_id);
CREATE INDEX IF NOT EXISTS idx_detection_stats_date ON detection_statistics(date);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_detection_dimensions_updated_at BEFORE UPDATE ON detection_dimensions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_detection_patterns_updated_at BEFORE UPDATE ON detection_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attack_samples_updated_at BEFORE UPDATE ON attack_samples FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
