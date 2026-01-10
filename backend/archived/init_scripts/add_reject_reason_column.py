#!/usr/bin/env python3
"""添加reject_reason字段到verifications表"""

import psycopg2

DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "safety_detection_db",
    "user": "safety_user",
    "password": "safety_pass_2024"
}

def add_reject_reason_column():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cursor = conn.cursor()

    try:
        # 检查reject_reason字段
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'verifications' AND column_name = 'reject_reason'
        """)
        exists = cursor.fetchone()

        if not exists:
            # 删除旧的reason字段(如果存在)
            cursor.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'verifications' AND column_name = 'reason'
            """)
            has_reason = cursor.fetchone()

            if has_reason:
                cursor.execute("ALTER TABLE verifications RENAME COLUMN reason TO reject_reason")
                print("✓ 重命名reason字段为reject_reason")
            else:
                cursor.execute("ALTER TABLE verifications ADD COLUMN reject_reason TEXT")
                print("✓ 添加reject_reason字段")

            conn.commit()
        else:
            print("- reject_reason字段已存在")

        # 验证表结构
        cursor.execute("""
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_name = 'verifications'
            ORDER BY ordinal_position
        """)
        print("\n当前表结构:")
        for row in cursor.fetchall():
            print(f"  - {row[0]}: {row[1]}")

    except Exception as e:
        print(f"错误: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    add_reject_reason_column()
