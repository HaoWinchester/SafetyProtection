-- API调用记录表
CREATE TABLE IF NOT EXISTS api_call_logs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    api_key_id VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_text TEXT,
    request_body JSONB,
    response_status INTEGER NOT NULL,
    response_body JSONB,
    risk_score DECIMAL(5, 4),
    risk_level VARCHAR(50),
    is_compliant BOOLEAN,
    threat_category VARCHAR(255),
    processing_time_ms INTEGER,
    ip_address VARCHAR(50),
    user_agent TEXT,
    call_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_api_call_logs_user_id ON api_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_api_key_id ON api_call_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_call_time ON api_call_logs(call_time DESC);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_risk_level ON api_call_logs(risk_level);

COMMENT ON TABLE api_call_logs IS 'API调用记录表';
COMMENT ON COLUMN api_call_logs.id IS '记录唯一标识';
COMMENT ON COLUMN api_call_logs.user_id IS '用户ID';
COMMENT ON COLUMN api_call_logs.api_key_id IS 'API Key ID';
COMMENT ON COLUMN api_call_logs.endpoint IS 'API端点';
COMMENT ON COLUMN api_call_logs.method IS 'HTTP方法';
COMMENT ON COLUMN api_call_logs.request_text IS '请求文本内容';
COMMENT ON COLUMN api_call_logs.request_body IS '请求体（JSON）';
COMMENT ON COLUMN api_call_logs.response_status IS 'HTTP响应状态码';
COMMENT ON COLUMN api_call_logs.response_body IS '响应体（JSON）';
COMMENT ON COLUMN api_call_logs.risk_score IS '风险分数';
COMMENT ON COLUMN api_call_logs.risk_level IS '风险等级';
COMMENT ON COLUMN api_call_logs.is_compliant IS '是否合规';
COMMENT ON COLUMN api_call_logs.threat_category IS '威胁类别';
COMMENT ON COLUMN api_call_logs.processing_time_ms IS '处理时间（毫秒）';
COMMENT ON COLUMN api_call_logs.ip_address IS '客户端IP地址';
COMMENT ON COLUMN api_call_logs.user_agent IS '客户端User-Agent';
COMMENT ON COLUMN api_call_logs.call_time IS '调用时间';
