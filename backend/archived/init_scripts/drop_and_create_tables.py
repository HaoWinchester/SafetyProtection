#!/usr/bin/env python3
"""
删除并重新创建检测模式数据库表
"""
import psycopg2

DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "safety_detection_db",
    "user": "safety_user",
    "password": "safety_pass_2024"
}

def drop_and_create_tables():
    """删除并重新创建表"""
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cursor = conn.cursor()
    conn.autocommit = True  # 自动提交，避免事务问题

    # 删除旧表和视图
    objects = [
        ('TABLE', 'pattern_combinations'),
        ('VIEW', 'detection_statistics'),
        ('TABLE', 'attack_samples'),
        ('TABLE', 'detection_patterns'),
        ('TABLE', 'detection_dimensions')
    ]

    for obj_type, obj_name in objects:
        try:
            cursor.execute(f"DROP {obj_type} IF EXISTS {obj_name} CASCADE")
            print(f"✓ 删除 {obj_type}: {obj_name}")
        except Exception as e:
            print(f"删除 {obj_type} {obj_name} 失败: {e}")

    conn.autocommit = False  # 恢复事务模式

    # 创建新表
    tables_sql = [
        """
        CREATE TABLE detection_dimensions (
            id SERIAL PRIMARY KEY,
            dimension_name VARCHAR(50) UNIQUE NOT NULL,
            dimension_code VARCHAR(30) UNIQUE NOT NULL,
            description TEXT,
            risk_weight DECIMAL(3,2) DEFAULT 1.00,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE detection_patterns (
            id SERIAL PRIMARY KEY,
            dimension_id INTEGER REFERENCES detection_dimensions(id),
            pattern_name VARCHAR(100) NOT NULL,
            pattern_type VARCHAR(20) NOT NULL,
            pattern_content TEXT NOT NULL,
            description TEXT,
            severity VARCHAR(20) DEFAULT 'medium',
            confidence DECIMAL(3,2) DEFAULT 0.70,
            is_case_sensitive BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            effectiveness_score DECIMAL(3,2),
            false_positive_rate DECIMAL(3,2),
            detection_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            source VARCHAR(100)
        )
        """,
        """
        CREATE TABLE attack_samples (
            id SERIAL PRIMARY KEY,
            dimension_id INTEGER REFERENCES detection_dimensions(id),
            sample_name VARCHAR(100),
            sample_text TEXT NOT NULL,
            sample_type VARCHAR(50),
            attack_variant VARCHAR(100),
            is_verified BOOLEAN DEFAULT TRUE,
            difficulty_level VARCHAR(20),
            bypasses_defenses TEXT,
            success_rate DECIMAL(3,2),
            detected_by_patterns INTEGER[],
            labels JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            source VARCHAR(100)
        )
        """,
        """
        CREATE TABLE detection_statistics (
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
        )
        """,
        """
        CREATE TABLE pattern_combinations (
            id SERIAL PRIMARY KEY,
            combination_name VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            logic_operator VARCHAR(10) DEFAULT 'AND',
            pattern_ids INTEGER[] NOT NULL,
            min_pattern_match INTEGER DEFAULT 1,
            severity VARCHAR(20) DEFAULT 'high',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    ]

    for sql in tables_sql:
        try:
            cursor.execute(sql)
        except Exception as e:
            print(f"创建表失败: {e}")
            print(f"SQL: {sql[:100]}...")

    # 创建索引
    indexes = [
        "CREATE INDEX idx_patterns_active ON detection_patterns(is_active, dimension_id)",
        "CREATE INDEX idx_samples_verified ON attack_samples(is_verified, dimension_id)",
        "CREATE INDEX idx_stats_date ON detection_statistics(date)"
    ]

    for index_sql in indexes:
        try:
            cursor.execute(index_sql)
            print(f"✓ 创建索引")
        except Exception as e:
            print(f"创建索引失败: {e}")

    conn.commit()
    cursor.close()
    conn.close()
    print("\n✓ 数据库表创建完成！")

if __name__ == "__main__":
    drop_and_create_tables()
