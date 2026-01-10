#!/usr/bin/env python3
"""添加submit_time字段到verifications表"""

import psycopg2

DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "safety_detection_db",
    "user": "safety_user",
    "password": "safety_pass_2024"
}

def add_submit_time_column():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cursor = conn.cursor()

    try:
        # 检查submit_time字段
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'verifications' AND column_name = 'submit_time'
        """)
        exists = cursor.fetchone()

        if not exists:
            # 检查是否有create_time字段
            cursor.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'verifications' AND column_name = 'create_time'
            """)
            has_create_time = cursor.fetchone()

            if has_create_time:
                # 如果有create_time但没有submit_time,添加submit_time字段
                cursor.execute("ALTER TABLE verifications ADD COLUMN submit_time TIMESTAMP")
                # 将create_time的值复制到submit_time
                cursor.execute("UPDATE verifications SET submit_time = create_time WHERE submit_time IS NULL")
                print("✓ 添加submit_time字段并从create_time复制数据")
            else:
                cursor.execute("ALTER TABLE verifications ADD COLUMN submit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
                print("✓ 添加submit_time字段")

            conn.commit()
        else:
            print("- submit_time字段已存在")

        # 验证
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'verifications' AND column_name IN ('create_time', 'submit_time')
        """)
        print("\n时间相关字段:")
        for row in cursor.fetchall():
            print(f"  - {row[0]}")

    except Exception as e:
        print(f"错误: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    add_submit_time_column()
