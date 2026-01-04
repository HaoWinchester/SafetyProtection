"""
测试API Key数据库持久化功能
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# 测试用户登录并获取token
def login_and_get_token():
    """登录并获取token"""
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "username": "testuser",
        "password": "test123"
    })

    if response.status_code == 200:
        data = response.json()
        return data.get("access_token")
    else:
        print(f"登录失败: {response.status_code} - {response.text}")
        return None

def test_create_api_key(token):
    """测试创建API Key"""
    print("\n=== 测试创建API Key ===")
    response = requests.post(
        f"{BASE_URL}/api/v1/user/projects",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "测试API Key",
            "description": "这是一个测试创建的API Key"
        }
    )

    if response.status_code == 200:
        api_key = response.json()
        print(f"✓ API Key创建成功:")
        print(f"  ID: {api_key['id']}")
        print(f"  名称: {api_key['name']}")
        print(f"  API Key: {api_key['api_key']}")
        print(f"  状态: {api_key['status']}")
        return api_key
    else:
        print(f"✗ 创建失败: {response.status_code} - {response.text}")
        return None

def test_get_api_keys(token):
    """测试获取API Keys列表"""
    print("\n=== 测试获取API Keys列表 ===")
    response = requests.get(
        f"{BASE_URL}/api/v1/user/projects",
        headers={"Authorization": f"Bearer {token}"}
    )

    if response.status_code == 200:
        api_keys = response.json()
        print(f"✓ 获取成功，共有 {len(api_keys)} 个API Keys:")
        for key in api_keys:
            print(f"  - {key['name']} ({key['api_key'][:20]}...)")
        return api_keys
    else:
        print(f"✗ 获取失败: {response.status_code} - {response.text}")
        return []

def test_update_api_key(token, key_id):
    """测试更新API Key"""
    print("\n=== 测试更新API Key ===")
    response = requests.put(
        f"{BASE_URL}/api/v1/user/projects/{key_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "更新后的API Key名称",
            "description": "更新后的描述信息"
        }
    )

    if response.status_code == 200:
        api_key = response.json()
        print(f"✓ API Key更新成功:")
        print(f"  ID: {api_key['id']}")
        print(f"  名称: {api_key['name']}")
        print(f"  描述: {api_key['description']}")
        return api_key
    else:
        print(f"✗ 更新失败: {response.status_code} - {response.text}")
        return None

def test_regenerate_api_key(token, key_id):
    """测试重新生成API Key"""
    print("\n=== 测试重新生成API Key ===")
    response = requests.post(
        f"{BASE_URL}/api/v1/user/projects/{key_id}/regenerate",
        headers={"Authorization": f"Bearer {token}"}
    )

    if response.status_code == 200:
        result = response.json()
        print(f"✓ API Key重新生成成功:")
        print(f"  新API Key: {result['api_key']}")
        print(f"  消息: {result['message']}")
        return result['api_key']
    else:
        print(f"✗ 重新生成失败: {response.status_code} - {response.text}")
        return None

def test_delete_api_key(token, key_id):
    """测试删除API Key"""
    print("\n=== 测试删除API Key ===")
    response = requests.delete(
        f"{BASE_URL}/api/v1/user/projects/{key_id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    if response.status_code == 200:
        result = response.json()
        print(f"✓ API Key删除成功:")
        print(f"  消息: {result['message']}")
        return True
    else:
        print(f"✗ 删除失败: {response.status_code} - {response.text}")
        return False

def test_database_persistence():
    """测试数据库持久化"""
    print("\n=== 测试数据库持久化 ===")
    import psycopg2

    DATABASE_CONFIG = {
        'host': 'localhost',
        'port': 5432,
        'database': 'safety_detection_db',
        'user': 'safety_user',
        'password': 'safety_pass_2024'
    }

    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        cursor = conn.cursor()

        # 查询所有API Keys
        cursor.execute("SELECT id, name, api_key, status FROM api_keys")
        api_keys = cursor.fetchall()

        print(f"✓ 数据库中有 {len(api_keys)} 条API Key记录:")
        for key in api_keys:
            print(f"  - ID: {key[0]}, 名称: {key[1]}, API Key: {key[2][:20]}..., 状态: {key[3]}")

        cursor.close()
        conn.close()
        return len(api_keys) > 0
    except Exception as e:
        print(f"✗ 数据库查询失败: {e}")
        return False

if __name__ == "__main__":
    print("开始测试API Key数据库持久化功能")

    # 1. 登录获取token
    token = login_and_get_token()
    if not token:
        print("无法获取token，测试终止")
        exit(1)

    print(f"✓ 登录成功，token: {token[:20]}...")

    # 2. 创建API Key
    api_key = test_create_api_key(token)
    if not api_key:
        print("创建API Key失败，测试终止")
        exit(1)

    key_id = api_key['id']

    # 3. 获取API Keys列表
    test_get_api_keys(token)

    # 4. 更新API Key
    test_update_api_key(token, key_id)

    # 5. 重新生成API Key
    test_regenerate_api_key(token, key_id)

    # 6. 测试数据库持久化
    test_database_persistence()

    # 7. 删除API Key
    test_delete_api_key(token, key_id)

    # 8. 再次测试数据库持久化
    test_database_persistence()

    print("\n=== 测试完成 ===")
