#!/usr/bin/env python3
"""
初始化测试API密钥 - 简化版
"""
import psycopg2
import secrets
from datetime import datetime

DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "safety_detection_db",
    "user": "safety_user",
    "password": "safety_pass_2024"
}

def generate_api_key():
    """生成API密钥"""
    random_bytes = secrets.token_bytes(32)
    api_key = f"sk-{random_bytes.hex()[:32]}"
    return api_key

def init_test_api_keys():
    """初始化测试API密钥"""
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cursor = conn.cursor()

    # 清理旧的测试数据
    print("清理旧的测试数据...")
    cursor.execute("DELETE FROM api_keys WHERE user_id LIKE 'user_%'")
    cursor.execute("DELETE FROM users WHERE user_id LIKE 'user_%'")
    conn.commit()

    # 测试用户和API密钥数据
    test_data = [
        {
            'user_id': 'user_test001',
            'username': '测试用户001',
            'email': 'test001@example.com',
            'key_name': '默认测试密钥',
            'description': '用于测试的默认API密钥'
        },
        {
            'user_id': 'user_admin',
            'username': '管理员用户',
            'email': 'admin001@example.com',
            'key_name': '管理员密钥',
            'description': '管理员专用API密钥'
        },
        {
            'user_id': 'user_developer',
            'username': '开发者用户',
            'email': 'dev001@example.com',
            'key_name': '开发测试密钥',
            'description': '用于开发环境的API密钥'
        },
        {
            'user_id': 'user_demo',
            'username': '演示用户',
            'email': 'demo001@example.com',
            'key_name': '演示密钥',
            'description': '用于演示的API密钥'
        }
    ]

    created_count = 0

    for data in test_data:
        # 创建用户
        cursor.execute("""
            INSERT INTO users (user_id, username, email, password_hash, role, status, remaining_quota, total_quota)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                username = EXCLUDED.username,
                email = EXCLUDED.email,
                status = EXCLUDED.status
        """, (data['user_id'], data['username'], data['email'], 'hashed_password', 'user', 'active', 10000, 10000))

        # 生成API密钥
        api_key = generate_api_key()
        key_id = f"key_{secrets.token_hex(8)}"

        # 创建API密钥
        cursor.execute("""
            INSERT INTO api_keys (id, user_id, name, description, api_key, status, call_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                api_key = EXCLUDED.api_key,
                status = EXCLUDED.status
        """, (key_id, data['user_id'], data['key_name'], data['description'], api_key, 'active', 0))

        print(f"✓ {data['key_name']}: {api_key}")
        created_count += 1

    conn.commit()
    cursor.close()
    conn.close()

    print(f"\n✓ 成功初始化 {created_count} 个API密钥")
    print("\n所有API密钥（可以直接复制使用）:")
    print("=" * 70)

    # 重新查询并显示所有API密钥
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("SELECT * FROM api_keys ORDER BY create_time DESC")
    keys = cursor.fetchall()

    for i, key in enumerate(keys, 1):
        print(f"\n{i}. {key['name']}")
        print(f"   API Key: {key['api_key']}")
        print(f"   User: {key['user_id']}")
        print(f"   描述: {key['description']}")
        print(f"   状态: {key['status']}")

    cursor.close()
    conn.close()

    print("\n" + "=" * 70)
    print("\n📝 使用说明:")
    print("1. 复制上面的API Key")
    print("2. 在请求头中添加: Authorization: Bearer <API_KEY>")
    print("3. 例如: curl -H \"Authorization: Bearer sk-xxx\" http://localhost:8000/api/v1/detection/detect")

    return created_count

if __name__ == "__main__":
    init_test_api_keys()
