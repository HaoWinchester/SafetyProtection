#!/usr/bin/env python3
"""修复孤儿认证记录 - 创建缺失的用户记录"""

import psycopg2
import uuid

DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "safety_detection_db",
    "user": "safety_user",
    "password": "safety_pass_2024"
}

def fix_orphaned_verifications():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cursor = conn.cursor()

    print("=" * 60)
    print("修复孤儿认证记录")
    print("=" * 60)

    try:
        # 1. 查找所有在verifications表中但不在users表中的user_id
        print("\n【1. 查找孤儿认证记录】")
        cursor.execute("""
            SELECT DISTINCT v.user_id, v.real_name
            FROM verifications v
            LEFT JOIN users u ON v.user_id = u.user_id
            WHERE u.user_id IS NULL
        """)
        orphaned = cursor.fetchall()

        if orphaned:
            print(f"找到 {len(orphaned)} 条孤儿认证记录:")
            for user_id, real_name in orphaned:
                print(f"  - {user_id} ({real_name})")
        else:
            print("✓ 没有孤儿记录,所有认证记录都有对应的用户")
            return

        # 2. 为这些user_id创建用户记录
        print("\n【2. 创建缺失的用户记录】")
        created_count = 0

        for user_id, real_name in orphaned:
            # 检查是否已经存在(避免重复)
            cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
            if cursor.fetchone():
                print(f"  - {user_id}: 已存在,跳过")
                continue

            # 创建新用户
            new_username = f"user_{user_id.split('_')[-1]}" if '_' in user_id else user_id
            new_email = f"{new_username}@example.com"

            cursor.execute("""
                INSERT INTO users (user_id, username, email, password_hash, role, verified)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, new_username, new_email, "default_password_hash", "user", False))

            created_count += 1
            print(f"  ✓ {user_id}: 已创建用户 ({new_username}, {new_email})")

        conn.commit()
        print(f"\n✅ 成功创建 {created_count} 个用户记录")

        # 3. 验证修复结果
        print("\n【3. 验证修复结果】")
        cursor.execute("""
            SELECT
                v.user_id,
                u.username,
                u.email,
                v.real_name,
                v.status
            FROM verifications v
            LEFT JOIN users u ON v.user_id = u.user_id
            ORDER BY v.submit_time DESC
            LIMIT 10
        """)

        results = cursor.fetchall()
        print("\n认证记录预览:")
        for row in results:
            status = "✓" if row[1] else "✗"
            print(f"  {status} {row[0]}: {row[1] or '(无用户)'} | {row[3]} | {row[4]}")

        # 4. 统计信息
        cursor.execute("SELECT COUNT(*) FROM verifications")
        ver_count = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*) FROM verifications v
            JOIN users u ON v.user_id = u.user_id
        """)
        linked_count = cursor.fetchone()[0]

        print(f"\n统计:")
        print(f"  - 认证记录总数: {ver_count}")
        print(f"  - 已关联用户的记录: {linked_count}")
        print(f"  - 孤儿记录: {ver_count - linked_count}")

    except Exception as e:
        print(f"\n✗ 错误: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

    print("\n" + "=" * 60)
    print("修复完成")
    print("=" * 60)

if __name__ == "__main__":
    fix_orphaned_verifications()
