-- 更新verifications表,添加新字段
-- 添加company和position字段
ALTER TABLE verifications ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE verifications ADD COLUMN IF NOT EXISTS position VARCHAR(255);

-- 添加审核相关字段
ALTER TABLE verifications ADD COLUMN IF NOT EXISTS review_time TIMESTAMP;
ALTER TABLE verifications ADD COLUMN IF NOT EXISTS reviewer_id VARCHAR(255);

-- 检查表结构
\d verifications;
