#!/usr/bin/env python3
"""测试管理员查看实名认证的API"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_admin_verifications():
    print("=" * 60)
    print("测试管理员查看实名认证API")
    print("=" * 60)

    # 1. 管理员登录
    print("\n【1. 管理员登录】")
    login_response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"}
    )

    if login_response.status_code == 200:
        login_data = login_response.json()
        access_token = login_data.get("access_token")
        print(f"✓ 登录成功")
        print(f"  Token: {access_token[:50]}...")
    else:
        print(f"✗ 登录失败: {login_response.status_code}")
        print(f"  {login_response.text}")
        return

    # 2. 获取所有认证申请
    print("\n【2. 获取所有认证申请】")
    headers = {"Authorization": f"Bearer {access_token}"}

    all_response = requests.get(
        f"{BASE_URL}/api/v1/admin/verifications",
        headers=headers
    )

    print(f"状态码: {all_response.status_code}")

    if all_response.status_code == 200:
        data = all_response.json()
        print(f"✓ 查询成功")
        print(f"  总数: {data.get('total', 0)}")
        print(f"  记录数: {len(data.get('verifications', []))}")

        if data.get('verifications'):
            print("\n认证记录:")
            for i, record in enumerate(data['verifications'], 1):
                print(f"\n  记录 {i}:")
                print(f"    用户ID: {record.get('user_id')}")
                print(f"    用户名: {record.get('username')}")
                print(f"    邮箱: {record.get('email')}")
                verification = record.get('verification', {})
                print(f"    真实姓名: {verification.get('real_name')}")
                print(f"    身份证号: {verification.get('id_card')}")
                print(f"    公司: {verification.get('company')}")
                print(f"    职位: {verification.get('position')}")
                print(f"    状态: {verification.get('status')}")
                print(f"    提交时间: {verification.get('submit_time')}")
    elif all_response.status_code == 403:
        print(f"✗ 权限不足 (403)")
        print(f"  原因: 当前用户不是管理员")
    else:
        print(f"✗ 查询失败")
        print(f"  {all_response.text}")

    # 3. 获取待审核的申请
    print("\n【3. 获取待审核的申请】")
    pending_response = requests.get(
        f"{BASE_URL}/api/v1/admin/verifications?status=pending",
        headers=headers
    )

    print(f"状态码: {pending_response.status_code}")

    if pending_response.status_code == 200:
        data = pending_response.json()
        print(f"✓ 查询成功")
        print(f"  待审核数量: {data.get('total', 0)}")

        if data.get('verifications'):
            print("\n待审核记录:")
            for i, record in enumerate(data['verifications'], 1):
                verification = record.get('verification', {})
                print(f"  {i}. {record.get('username')} - {verification.get('real_name')} ({verification.get('status')})")
    else:
        print(f"✗ 查询失败")

    # 4. 测试权限检查(普通用户无法访问)
    print("\n【4. 测试权限检查】")

    # 创建或获取普通用户token
    user_login = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": "user_test001", "password": "default_password_hash"}
    )

    if user_login.status_code == 200:
        user_token = user_login.json().get("access_token")
        user_headers = {"Authorization": f"Bearer {user_token}"}

        user_response = requests.get(
            f"{BASE_URL}/api/v1/admin/verifications",
            headers=user_headers
        )

        if user_response.status_code == 403:
            print(f"✓ 权限检查正常工作")
            print(f"  普通用户无法访问管理员API (403)")
        else:
            print(f"✗ 权限检查可能有问题")
            print(f"  普通用户居然能访问! 状态码: {user_response.status_code}")
    else:
        print("  - 无法测试权限检查(普通用户登录失败)")

    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_admin_verifications()
    except requests.exceptions.ConnectionError:
        print("\n✗ 无法连接到服务器")
        print("  请确保后端服务器正在运行 (python3 simple_server.py)")
    except Exception as e:
        print(f"\n✗ 错误: {e}")
