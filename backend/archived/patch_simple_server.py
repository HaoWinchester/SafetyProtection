#!/usr/bin/env python3
"""
自动修补 simple_server.py - 替换内存数据库操作为数据库操作
"""
import re

def patch_simple_server():
    """修补 simple_server.py 文件"""
    file_path = "simple_server.py"

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. 添加导入语句（在已有的导入之后）
    import_section = '''# 导入用户中心API模块
from user_apis import (
    get_all_users_api,
    update_user_quota_api,
    get_user_info_api,
    update_user_info_api,
    change_password_api,
    get_bills_api,
    get_verify_status_api,
    get_packages_api,
    get_subscription_overview_api,
    subscribe_package_api,
    get_usage_records_api,
    get_detection_usage_stats_api,
    get_tickets_api,
    create_ticket_api,
    get_ticket_detail_api,
    update_ticket_api,
    get_system_settings_api,
    update_system_settings_api
)
'''

    # 在第一个 import usercenter_api 之后插入
    if 'from user_apis import' not in content:
        content = content.replace(
            '# 导入用户中心API扩展 - 暂时注释,直接在此文件中定义\n# import usercenter_api',
            import_section + '# 导入用户中心API扩展 - 已替换为数据库版本'
        )

    # 2. 替换 get_all_users API
    old_get_all_users = r'@app\.get\("/api/v1/auth/admin/users"\)\s*\nasync def get_all_users\(current_user: dict = Depends\(get_current_user\)\):\s*\n""".*?"""\s*\nif current_user\["role"\] != "admin":\s*\nraise HTTPException\(status_code=403, detail="需要管理员权限"\)\s*\nreturn list\(users_db\.values\(\)\)'

    new_get_all_users = '''@app.get("/api/v1/auth/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    """获取所有用户 (管理员)"""
    return await run_async(get_all_users_api, current_user)'''

    content = re.sub(old_get_all_users, new_get_all_users, content, flags=re.DOTALL)

    # 3. 替换 update_user_quota API
    old_update_quota = r'@app\.patch\("/api/v1/auth/admin/users/\{user_id\}/quota"\)\s*\nasync def update_user_quota\(\s*user_id: str,\s*quota_update: dict,\s*current_user: dict = Depends\(get_current_user\)\s*\):\s*""".*?"""\s*if current_user\["role"\] != "admin":\s*raise HTTPException\(status_code=403, detail="需要管理员权限"\)\s*user = users_db\.get\(user_id\)\s*if not user:\s*raise HTTPException\(status_code=404, detail="用户不存在"\)\s*amount = quota_update\.get\("amount", 0\)\s*user\["remaining_quota"\] \+= amount\s*user\["total_quota"\] \+= amount\s*return \{.*?\}'

    new_update_quota = '''@app.patch("/api/v1/auth/admin/users/{user_id}/quota")
async def update_user_quota(
    user_id: str,
    quota_update: dict,
    current_user: dict = Depends(get_current_user)
):
    """更新用户配额 (管理员)"""
    return await run_async(update_user_quota_api, user_id, quota_update, current_user)'''

    content = re.sub(old_update_quota, new_update_quota, content, flags=re.DOTALL)

    # 保存修改后的文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✓ simple_server.py 修补完成")
    print("⚠ 请手动检查并测试所有API端点")

if __name__ == "__main__":
    patch_simple_server()
