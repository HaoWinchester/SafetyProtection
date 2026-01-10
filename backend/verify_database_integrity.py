#!/usr/bin/env python3
"""
数据库完整性验证脚本
检查所有数据是否正确保存在数据库中
"""
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "safety_detection_db",
    "user": "safety_user",
    "password": "safety_pass_2024"
}

def print_section(title: str):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def print_result(test_name: str, passed: bool, details: str = ""):
    status = "✅" if passed else "❌"
    print(f"{status} {test_name}")
    if details:
        print(f"   {details}")

def main():
    print("\n" + "🔬"*40)
    print(" "*15 + "数据库完整性验证")
    print("🔬"*40)

    conn = psycopg2.connect(**DATABASE_CONFIG)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    results = []

    # ==================== 1. 表结构验证 ====================
    print_section("1. 数据库表结构验证")

    try:
        cursor.execute("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)
        tables = cursor.fetchall()
        table_names = [t['tablename'] for t in tables]

        expected_tables = [
            'users', 'api_keys', 'packages', 'subscriptions', 'orders',
            'bills', 'tickets', 'verifications', 'usage_records',
            'detection_usage', 'settings', 'api_call_logs',
            'detection_dimensions', 'detection_patterns', 'attack_samples',
            'detection_statistics', 'pattern_combinations', 'verifications_cache'
        ]

        missing_tables = set(expected_tables) - set(table_names)
        if not missing_tables:
            print_result("核心表存在性", True, f"所有{len(expected_tables)}个核心表都存在")
            results.append(("表结构", True))
        else:
            print_result("核心表存在性", False, f"缺少表: {missing_tables}")
            results.append(("表结构", False))

    except Exception as e:
        print_result("表结构检查", False, str(e))
        results.append(("表结构", False))

    # ==================== 2. 用户数据验证 ====================
    print_section("2. 用户数据验证")

    try:
        cursor.execute("SELECT COUNT(*) as count FROM users")
        user_count = cursor.fetchone()['count']
        print_result("用户表记录数", user_count > 0, f"共{user_count}个用户")

        cursor.execute("SELECT user_id, username, email FROM users LIMIT 5")
        users = cursor.fetchall()
        print_result("用户数据示例", len(users) > 0, "前5个用户:")
        for user in users:
            print(f"   - {user['username']} ({user['email']})")

        # 检查测试用户
        cursor.execute("SELECT * FROM users WHERE user_id = %s", ("user_test001",))
        test_user = cursor.fetchone()
        if test_user:
            print_result("测试用户存在", True, f"配额: {test_user['remaining_quota']}/{test_user['total_quota']}")
            results.append(("用户数据", True))
        else:
            print_result("测试用户存在", False, "测试用户不存在")
            results.append(("用户数据", False))

    except Exception as e:
        print_result("用户数据检查", False, str(e))
        results.append(("用户数据", False))

    # ==================== 3. API密钥数据验证 ====================
    print_section("3. API密钥数据验证")

    try:
        cursor.execute("SELECT COUNT(*) as count FROM api_keys")
        key_count = cursor.fetchone()['count']
        print_result("API密钥记录数", key_count > 0, f"共{key_count}个API密钥")

        cursor.execute("SELECT name, api_key, status FROM api_keys LIMIT 5")
        keys = cursor.fetchall()
        print_result("API密钥示例", len(keys) > 0, "前5个密钥:")
        for key in keys:
            masked_key = key['api_key'][:10] + "..."
            print(f"   - {key['name']}: {masked_key} ({key['status']})")

        results.append(("API密钥", key_count > 0))

    except Exception as e:
        print_result("API密钥检查", False, str(e))
        results.append(("API密钥", False))

    # ==================== 4. 套餐数据验证 ====================
    print_section("4. 套餐数据验证")

    try:
        cursor.execute("SELECT COUNT(*) as count FROM packages")
        package_count = cursor.fetchone()['count']
        print_result("套餐记录数", package_count >= 3, f"共{package_count}个套餐")

        cursor.execute("SELECT name, price, quota_amount FROM packages ORDER BY price")
        packages = cursor.fetchall()
        print_result("套餐列表", len(packages) >= 3, "可用套餐:")
        for pkg in packages:
            print(f"   - {pkg['name']}: ¥{pkg['price']}, {pkg['quota_amount']}次调用")

        results.append(("套餐数据", len(packages) >= 3))

    except Exception as e:
        print_result("套餐数据检查", False, str(e))
        results.append(("套餐数据", False))

    # ==================== 5. 检测记录验证 ====================
    print_section("5. 检测记录数据验证")

    try:
        cursor.execute("SELECT COUNT(*) as count FROM api_call_logs")
        log_count = cursor.fetchone()['count']
        print_result("API调用日志记录数", log_count >= 0, f"共{log_count}条记录")

        if log_count > 0:
            cursor.execute("""
                SELECT
                    COUNT(*) FILTER (WHERE is_compliant = true) as compliant,
                    COUNT(*) FILTER (WHERE is_compliant = false) as risky,
                    AVG(risk_score) as avg_risk
                FROM api_call_logs
            """)
            stats = cursor.fetchone()
            print_result("检测统计", True, f"合规: {stats['compliant']}, 风险: {stats['risky']}, 平均风险分: {stats['avg_risk']:.2f}")

        results.append(("检测记录", True))

    except Exception as e:
        print_result("检测记录检查", False, str(e))
        results.append(("检测记录", False))

    # ==================== 6. 检测模式验证 ====================
    print_section("6. 检测模式数据验证")

    try:
        cursor.execute("SELECT COUNT(*) as count FROM detection_patterns")
        pattern_count = cursor.fetchone()['count']
        print_result("检测模式记录数", pattern_count > 0, f"共{pattern_count}个检测模式")

        cursor.execute("SELECT dimension_id, COUNT(*) as count FROM detection_patterns GROUP BY dimension_id")
        dimensions = cursor.fetchall()
        print_result("维度分布", len(dimensions) > 0, f"覆盖{len(dimensions)}个维度:")
        for dim in dimensions:
            print(f"   - 维度 {dim['dimension_id']}: {dim['count']}个模式")

        results.append(("检测模式", pattern_count > 0))

    except Exception as e:
        print_result("检测模式检查", False, str(e))
        results.append(("检测模式", False))

    # ==================== 7. 订阅数据验证 ====================
    print_section("7. 订阅数据验证")

    try:
        cursor.execute("SELECT COUNT(*) as count FROM subscriptions")
        sub_count = cursor.fetchone()['count']
        print_result("订阅记录数", True, f"共{sub_count}条订阅")

        if sub_count > 0:
            cursor.execute("""
                SELECT s.*, u.username
                FROM subscriptions s
                JOIN users u ON s.user_id = u.user_id
                LIMIT 5
            """)
            subs = cursor.fetchall()
            print_result("订阅示例", True, f"前{len(subs)}条订阅:")
            for sub in subs:
                print(f"   - {sub['username']}: {sub['plan_name']} ({sub['status']})")

        results.append(("订阅数据", True))

    except Exception as e:
        print_result("订阅数据检查", False, str(e))
        results.append(("订阅数据", False))

    # ==================== 8. 系统设置验证 ====================
    print_section("8. 系统设置数据验证")

    try:
        cursor.execute("SELECT COUNT(*) as count FROM settings")
        setting_count = cursor.fetchone()['count']
        print_result("系统设置记录数", setting_count > 0, f"共{setting_count}个设置")

        cursor.execute("SELECT key, value FROM settings LIMIT 5")
        settings = cursor.fetchall()
        print_result("设置示例", len(settings) > 0, "前5个设置:")
        for setting in settings:
            print(f"   - {setting['key']}: {setting['value']}")

        results.append(("系统设置", setting_count > 0))

    except Exception as e:
        print_result("系统设置检查", False, str(e))
        results.append(("系统设置", False))

    # ==================== 9. 数据一致性验证 ====================
    print_section("9. 数据一致性验证")

    try:
        # 检查外键关系
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM api_keys ak
            LEFT JOIN users u ON ak.user_id = u.user_id
            WHERE u.user_id IS NULL
        """)
        orphan_keys = cursor.fetchone()['count']
        print_result("API密钥外键一致性", orphan_keys == 0, f"孤儿API密钥: {orphan_keys}个")

        cursor.execute("""
            SELECT COUNT(*) as count
            FROM api_call_logs acl
            LEFT JOIN users u ON acl.user_id = u.user_id
            WHERE u.user_id IS NULL
        """)
        orphan_logs = cursor.fetchone()['count']
        print_result("日志外键一致性", orphan_logs == 0, f"孤儿日志: {orphan_logs}条")

        results.append(("数据一致性", orphan_keys == 0 and orphan_logs == 0))

    except Exception as e:
        print_result("数据一致性检查", False, str(e))
        results.append(("数据一致性", False))

    # ==================== 10. 数据持久化测试 ====================
    print_section("10. 数据持久化测试")

    try:
        # 读取测试用户
        cursor.execute("SELECT user_id, remaining_quota FROM users WHERE user_id = %s", ("user_test001",))
        user = cursor.fetchone()

        if user:
            original_quota = user['remaining_quota']

            # 修改配额
            new_quota = original_quota + 1
            cursor.execute("UPDATE users SET remaining_quota = %s WHERE user_id = %s",
                         (new_quota, "user_test001"))
            conn.commit()

            # 读取验证
            cursor.execute("SELECT remaining_quota FROM users WHERE user_id = %s", ("user_test001",))
            updated_user = cursor.fetchone()

            if updated_user['remaining_quota'] == new_quota:
                print_result("写入后立即读取", True, f"配额: {original_quota} -> {new_quota}")

                # 恢复原配额
                cursor.execute("UPDATE users SET remaining_quota = %s WHERE user_id = %s",
                             (original_quota, "user_test001"))
                conn.commit()

                print_result("恢复原数据", True, f"已恢复: {original_quota}")
                results.append(("数据持久化", True))
            else:
                print_result("写入后立即读取", False, "数据不一致")
                results.append(("数据持久化", False))
        else:
            print_result("数据持久化测试", False, "测试用户不存在")
            results.append(("数据持久化", False))

    except Exception as e:
        print_result("数据持久化测试", False, str(e))
        results.append(("数据持久化", False))

    # ==================== 总结 ====================
    print_section("验证总结")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅" if result else "❌"
        print(f"{status} {name}")

    print(f"\n通过率: {passed}/{total} ({passed*100//total}%)")

    if passed == total:
        print("\n🎉 数据库完整性验证全部通过！")
        print("\n📊 数据状态:")
        print(f"   - 用户数: {user_count}")
        print(f"   - API密钥: {key_count}")
        print(f"   - 检测记录: {log_count}")
        print(f"   - 检测模式: {pattern_count}")
        print("\n✅ 所有数据正确保存在数据库中")
        print("✅ 数据持久化正常工作")
        print("✅ 外键关系完整")
    else:
        print(f"\n⚠️  有 {total-passed} 项验证失败，需要检查")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
