#!/usr/bin/env python3
"""
初始化测试API密钥
"""
import psycopg2
import secrets
import hashlib
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
    # 使用secrets模块生成安全的随机密钥
    random_bytes = secrets.token_bytes(32)
    api_key = f"sk-{random_bytes.hex()[:32]}"
    return api_key

def init_test_api_keys():
    """初始化测试API密钥"""
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cursor = conn.cursor()

    # 测试用户和API密钥
    test_data = [
        {
            'user_id': 'user_test001',
            'username': '测试用户',
            'email': 'test@example.com',
            'key_name': '默认测试密钥',
            'description': '用于测试的默认API密钥'
        },
        {
            'user_id': 'user_admin',
            'username': '管理员',
            'email': 'admin@example.com',
            'key_name': '管理员密钥',
            'description': '管理员专用API密钥'
        },
        {
            'user_id': 'user_developer',
            'username': '开发者',
            'email': 'dev@example.com',
            'key_name': '开发测试密钥',
            'description': '用于开发环境的API密钥'
        },
        {
            'user_id': 'user_demo',
            'username': '演示用户',
            'email': 'demo@example.com',
            'key_name': '演示密钥',
            'description': '用于演示的API密钥'
        }
    ]

    created_count = 0

    for data in test_data:
        # 检查用户是否已存在
        cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (data['user_id'],))
        user_exists = cursor.fetchone()

        if not user_exists:
            # 创建用户
            cursor.execute("""
                INSERT INTO users (user_id, username, email, password_hash, role, status, remaining_quota, total_quota)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id) DO NOTHING
            """, (data['user_id'], data['username'], data['email'], 'hashed_password', 'user', 'active', 10000, 10000))
            print(f"✓ 创建用户: {data['username']} ({data['user_id']})")

        # 生成或获取API密钥
        api_key = generate_api_key()
        key_id = f"key_{secrets.token_hex(8)}"

        # 检查是否已存在相同名称的密钥
        cursor.execute("SELECT id FROM api_keys WHERE user_id = %s AND name = %s",
                      (data['user_id'], data['key_name']))
        key_exists = cursor.fetchone()

        if not key_exists:
            cursor.execute("""
                INSERT INTO api_keys (id, user_id, name, description, api_key, status, call_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (key_id, data['user_id'], data['key_name'], data['description'],
                  api_key, 'active', 0))
            print(f"✓ 创建API密钥: {data['key_name']}")
            print(f"  User ID: {data['user_id']}")
            print(f"  API Key: {api_key}")
            print(f"  Key ID: {key_id}")
            created_count += 1

    conn.commit()
    cursor.close()
    conn.close()

    print(f"\n✓ 成功初始化 {created_count} 个API密钥")
    print("\n生成的API密钥（用于测试）:")
    print("=" * 60)

    # 重新查询并显示所有API密钥
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("SELECT * FROM api_keys ORDER BY create_time DESC")
    keys = cursor.fetchall()

    for key in keys:
        print(f"\n用户: {key['user_id']}")
        print(f"密钥名称: {key['name']}")
        print(f"API Key: {key['api_key']}")
        print(f"状态: {key['status']}")
        print(f"描述: {key['description']}")

    cursor.close()
    conn.close()

    return created_count

if __name__ == "__main__":
    init_test_api_keys()
