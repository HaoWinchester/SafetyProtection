#!/usr/bin/env python3
"""添加verifications表的缺失字段"""

import psycopg2

DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "safety_detection_db",
    "user": "safety_user",
    "password": "safety_pass_2024"
}

def add_columns():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cursor = conn.cursor()

    try:
        # 检查现有列
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'verifications'
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        print(f"现有列: {existing_columns}")

        # 添加company字段
        if 'company' not in existing_columns:
            cursor.execute("ALTER TABLE verifications ADD COLUMN company VARCHAR(255)")
            print("✓ 添加company字段")
        else:
            print("- company字段已存在")

        # 添加position字段
        if 'position' not in existing_columns:
            cursor.execute("ALTER TABLE verifications ADD COLUMN position VARCHAR(255)")
            print("✓ 添加position字段")
        else:
            print("- position字段已存在")

        # 添加review_time字段
        if 'review_time' not in existing_columns:
            cursor.execute("ALTER TABLE verifications ADD COLUMN review_time TIMESTAMP")
            print("✓ 添加review_time字段")
        else:
            print("- review_time字段已存在")

        # 添加reviewer_id字段
        if 'reviewer_id' not in existing_columns:
            cursor.execute("ALTER TABLE verifications ADD COLUMN reviewer_id VARCHAR(255)")
            print("✓ 添加reviewer_id字段")
        else:
            print("- reviewer_id字段已存在")

        conn.commit()
        print("\n✅ 所有字段添加完成!")

        # 验证结果
        cursor.execute("""
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_name = 'verifications'
            ORDER BY ordinal_position
        """)
        print("\n更新后的表结构:")
        for row in cursor.fetchall():
            print(f"  - {row[0]}: {row[1]}")

    except Exception as e:
        print(f"错误: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    add_columns()
