"""
测试管理员权限修复
验证管理员账号能否正确查看用户提交的实名认证记录
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_admin_login():
    """测试管理员登录"""
    print("\n=== 测试管理员登录 ===")
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })

    if response.status_code == 200:
        data = response.json()
        print(f"✓ 管理员登录成功")
        print(f"  用户名: {data['user']['username']}")
        print(f"  角色: {data['user'].get('role', '未设置')}")
        print(f"  Token: {data['access_token'][:50]}...")
        return data['access_token']
    else:
        print(f"✗ 管理员登录失败: {response.status_code}")
        print(f"  错误信息: {response.text}")
        return None

def test_user_login():
    """测试普通用户登录"""
    print("\n=== 测试普通用户登录 ===")
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "username": "testuser",
        "password": "test123"
    })

    if response.status_code == 200:
        data = response.json()
        print(f"✓ 普通用户登录成功")
        print(f"  用户名: {data['user']['username']}")
        print(f"  角色: {data['user'].get('role', '未设置')}")
        return data['access_token']
    else:
        print(f"✗ 普通用户登录失败: {response.status_code}")
        return None

def test_user_submit_verification(user_token):
    """测试用户提交实名认证"""
    print("\n=== 测试用户提交实名认证 ===")

    headers = {"Authorization": user_token}
    response = requests.post(
        f"{BASE_URL}/api/v1/user/verify",
        headers=headers,
        json={
            "real_name": "张三",
            "id_card": "110101199001011234",
            "company": "测试公司",
            "position": "测试工程师"
        }
    )

    if response.status_code == 200:
        print(f"✓ 用户提交实名认证成功")
        data = response.json()
        print(f"  认证ID: {data.get('verification_id', 'N/A')}")
        return True
    else:
        print(f"✗ 用户提交实名认证失败: {response.status_code}")
        print(f"  错误信息: {response.text}")
        return False

def test_admin_get_verifications(admin_token):
    """测试管理员获取所有认证记录"""
    print("\n=== 测试管理员获取认证记录 ===")

    headers = {"Authorization": admin_token}

    # 获取所有认证记录
    response = requests.get(
        f"{BASE_URL}/api/v1/admin/verifications",
        headers=headers
    )

    if response.status_code == 200:
        print(f"✓ 管理员获取认证记录成功")
        data = response.json()
        print(f"  总记录数: {data['total']}")
        print(f"  认证记录数: {len(data['verifications'])}")

        if data['verifications']:
            print(f"\n  认证记录列表:")
            for idx, ver in enumerate(data['verifications'], 1):
                print(f"    {idx}. 用户ID: {ver['user_id']}, 用户名: {ver['username']}, 状态: {ver['verification']['status']}")
        else:
            print(f"  当前没有认证记录")
        return True
    else:
        print(f"✗ 管理员获取认证记录失败: {response.status_code}")
        print(f"  错误信息: {response.text}")
        return False

def test_user_cannot_access_admin_api(user_token):
    """测试普通用户无法访问管理员API"""
    print("\n=== 测试普通用户访问管理员API(应该失败) ===")

    headers = {"Authorization": user_token}
    response = requests.get(
        f"{BASE_URL}/api/v1/admin/verifications",
        headers=headers
    )

    if response.status_code == 403:
        print(f"✓ 普通用户正确被阻止访问管理员API")
        print(f"  状态码: {response.status_code}")
        return True
    else:
        print(f"✗ 权限控制存在问题: {response.status_code}")
        print(f"  错误信息: {response.text}")
        return False

def main():
    print("=" * 60)
    print("管理员权限修复验证测试")
    print("=" * 60)

    # 测试管理员登录
    admin_token = test_admin_login()
    if not admin_token:
        print("\n✗ 管理员登录失败,测试终止")
        return

    # 测试普通用户登录
    user_token = test_user_login()
    if not user_token:
        print("\n✗ 普通用户登录失败,跳过相关测试")
    else:
        # 测试用户提交实名认证
        test_user_submit_verification(user_token)

        # 测试普通用户无法访问管理员API
        test_user_cannot_access_admin_api(user_token)

    # 测试管理员获取认证记录
    test_admin_get_verifications(admin_token)

    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)

if __name__ == "__main__":
    main()
