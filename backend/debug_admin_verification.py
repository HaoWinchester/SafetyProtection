#!/usr/bin/env python3
"""调试管理员查看实名认证的功能"""

import psycopg2
import json

DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "safety_detection_db",
    "user": "safety_user",
    "password": "safety_pass_2024"
}

def debug_admin_verification():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cursor = conn.cursor()

    print("=" * 60)
    print("管理员实名认证调试工具")
    print("=" * 60)

    # 1. 检查管理员账号
    print("\n【1. 检查管理员账号】")
    cursor.execute("""
        SELECT user_id, username, email, role, verified
        FROM users
        WHERE role = 'admin' OR username = 'admin'
    """)
    admins = cursor.fetchall()

    if admins:
        print(f"✓ 找到 {len(admins)} 个管理员账号:")
        for admin in admins:
            print(f"  - ID: {admin[0]}")
            print(f"    用户名: {admin[1]}")
            print(f"    邮箱: {admin[2]}")
            print(f"    角色: {admin[3]}")
            print(f"    已认证: {admin[4]}")
    else:
        print("✗ 未找到管理员账号!")
        print("  请先创建管理员账号")

    # 2. 检查认证申请数据
    print("\n【2. 检查实名认证申请数据】")
    cursor.execute("""
        SELECT COUNT(*) FROM verifications
    """)
    count = cursor.fetchone()[0]

    if count > 0:
        print(f"✓ 共有 {count} 条认证申请记录")

        # 按状态统计
        cursor.execute("""
            SELECT status, COUNT(*) as cnt
            FROM verifications
            GROUP BY status
        """)
        stats = cursor.fetchall()
        print("\n状态分布:")
        for status, cnt in stats:
            print(f"  - {status}: {cnt} 条")

        # 显示最近的5条记录
        cursor.execute("""
            SELECT v.user_id, u.username, v.real_name, v.status, v.submit_time
            FROM verifications v
            LEFT JOIN users u ON v.user_id = u.user_id
            ORDER BY v.submit_time DESC
            LIMIT 5
        """)
        recent = cursor.fetchall()
        print("\n最近5条记录:")
        for record in recent:
            print(f"  - 用户ID: {record[0]}")
            print(f"    用户名: {record[1] or '(未找到)'}")
            print(f"    真实姓名: {record[2]}")
            print(f"    状态: {record[3]}")
            print(f"    提交时间: {record[4]}")
    else:
        print("✗ 没有认证申请记录")
        print("  请先让用户提交实名认证申请")

    # 3. 测试API查询
    print("\n【3. 测试管理员API查询】")
    if admins:
        admin_user_id = admins[0][0]
        print(f"使用管理员账号: {admin_user_id}")

        # 测试查询所有认证
        cursor.execute("""
            SELECT v.user_id, u.username, u.email, v.real_name, v.id_card,
                   v.company, v.position, v.status, v.reject_reason, v.submit_time
            FROM verifications v
            LEFT JOIN users u ON v.user_id = u.user_id
            ORDER BY v.submit_time DESC
        """)

        results = cursor.fetchall()
        print(f"\n查询结果: {len(results)} 条记录")

        if results:
            print("\n前3条数据:")
            for i, row in enumerate(results[:3], 1):
                print(f"\n记录 {i}:")
                print(f"  user_id: {row[0]}")
                print(f"  username: {row[1]}")
                print(f"  email: {row[2]}")
                print(f"  real_name: {row[3]}")
                print(f"  status: {row[7]}")

    # 4. 检查表结构
    print("\n【4. 检查verifications表结构】")
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'verifications'
        ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()

    print("表字段:")
    for col in columns:
        nullable = "NULL" if col[2] == "YES" else "NOT NULL"
        print(f"  - {col[0]}: {col[1]} ({nullable})")

    # 5. 权限检查建议
    print("\n【5. 权限检查建议】")
    print("请确认以下几点:")
    print("  1. 管理员账号的 role 字段必须是 'admin'")
    print("  2. 登录时使用的是管理员账号")
    print("  3. 前端正确携带了 Authorization Token")
    print("  4. Token 未过期且有效")

    # 6. 前端请求示例
    print("\n【6. 前端请求示例】")
    print("GET /api/v1/admin/verifications?status=pending")
    print("Headers:")
    print("  Authorization: Bearer <your_admin_token>")
    print("\n如果返回 403 错误,说明权限检查失败")
    print("如果返回 404 错误,说明路由不存在")
    print("如果返回空数组,说明没有符合条件的记录")

    cursor.close()
    conn.close()

    print("\n" + "=" * 60)
    print("调试完成")
    print("=" * 60)

if __name__ == "__main__":
    debug_admin_verification()
