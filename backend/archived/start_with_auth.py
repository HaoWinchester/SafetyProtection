#!/usr/bin/env python3
"""
带认证功能的后端服务器
"""
import sys
import os

# 将backend目录添加到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入认证API
from auth_api_extension import (
    register_user_endpoint,
    login_user_endpoint,
    get_me_endpoint,
    get_quota_endpoint,
    get_packages_endpoint,
    create_order_endpoint,
    pay_order_endpoint,
    get_orders_endpoint,
    get_all_users_endpoint,
    update_user_quota_endpoint,
    UserCreate,
    UserLogin,
    OrderCreate
)

# 导入原始服务器
from simple_server import app
from fastapi import HTTPException

# 添加认证端点
@app.post("/api/v1/auth/register", response_model=dict)
async def register_user(user_data: UserCreate):
    """用户注册"""
    return await register_user_endpoint(user_data)

@app.post("/api/v1/auth/login", response_model=dict)
async def login_user(credentials: UserLogin):
    """用户登录"""
    return await login_user_endpoint(credentials)

@app.get("/api/v1/auth/me", response_model=dict)
async def get_me():
    """获取当前用户信息 (需要认证)"""
    # 简化版:直接从token获取用户
    from fastapi import Request
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    
    security = HTTPBearer()
    try:
        credentials: HTTPAuthorizationCredentials = await security(Request({"type": "http", "headers": {"authorization": []}}))
        token = credentials.credentials
        user_id = token.replace("Bearer ", "")
        
        # 导入users_db
        import simple_server
        if user_id in simple_server.users_db:
            return simple_server.users_db[user_id]
        raise HTTPException(status_code=401, detail="用户不存在")
    except:
        raise HTTPException(status_code=401, detail="需要认证")

@app.get("/api/v1/auth/quota", response_model=dict)
async def get_quota():
    """获取配额信息"""
    return await get_quota_endpoint()

@app.get("/api/v1/auth/packages", response_model=list)
async def get_packages(is_active: bool = True):
    """获取套餐列表"""
    return await get_packages_endpoint(is_active)

@app.post("/api/v1/auth/orders", response_model=dict)
async def create_order(order_data: OrderCreate):
    """创建订单"""
    return await create_order_endpoint(order_data)

@app.post("/api/v1/auth/orders/{order_id}/pay", response_model=dict)
async def pay_order(order_id: str):
    """支付订单"""
    return await pay_order_endpoint(order_id)

@app.get("/api/v1/auth/orders", response_model=dict)
async def get_orders(page: int = 1, page_size: int = 10):
    """获取订单列表"""
    return await get_orders_endpoint(page, page_size)

@app.get("/api/v1/auth/admin/users", response_model=list)
async def get_all_users():
    """获取所有用户 (管理员)"""
    return await get_all_users_endpoint()

@app.patch("/api/v1/auth/admin/users/{user_id}/quota", response_model=dict)
async def update_user_quota(user_id: str, quota_update: dict):
    """更新用户配额 (管理员)"""
    return await update_user_quota_endpoint(user_id, quota_update)

if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("大模型安全检测工具 - 带认证功能的后端服务")
    print("=" * 50)
    print("✅ 认证API已启用")
    print("✅ 默认管理员: admin / admin123")
    print("✅ 默认用户ID: admin_001")
    print("=" * 50)
    print("API文档: http://localhost:8000/docs")
    print("主页: http://localhost:8000")
    print("=" * 50)

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
