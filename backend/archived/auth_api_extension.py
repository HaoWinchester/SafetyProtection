"""
认证API扩展模块
添加用户认证、配额管理和订单功能
"""
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from datetime import timedelta
import uuid
import hashlib
from datetime import datetime

# 导入主应用的全局变量
from simple_server import users_db, orders_db, packages_db, detection_usage_db

auth_security = HTTPBearer()

# ===== Pydantic Schemas =====

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class OrderCreate(BaseModel):
    package_id: str
    payment_method: Optional[str] = None

# ===== 辅助函数 =====

def hash_password(password: str) -> str:
    """哈希密码"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(user_id: str) -> str:
    """创建访问令牌"""
    return f"Bearer {user_id}"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(auth_security)):
    """获取当前用户"""
    token = credentials.credentials
    user_id = token.replace("Bearer ", "")

    if user_id not in users_db:
        raise HTTPException(status_code=401, detail="用户不存在或token无效")

    user = users_db[user_id]
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="用户已被禁用")

    return user

# ===== API端点 =====

async def register_user_endpoint(request: UserCreate):
    """用户注册"""
    # 检查邮箱和用户名是否已存在
    for user in users_db.values():
        if user["email"] == request.email:
            raise HTTPException(status_code=400, detail="邮箱已被注册")
        if user["username"] == request.username:
            raise HTTPException(status_code=400, detail="用户名已被占用")

    # 创建新用户
    user_id = f"user_{uuid.uuid4().hex[:16]}"
    new_user = {
        "user_id": user_id,
        "email": request.email,
        "username": request.username,
        "hashed_password": hash_password(request.password),
        "full_name": request.full_name,
        "phone": request.phone,
        "company": request.company,
        "role": "user",
        "is_active": True,
        "is_verified": False,
        "remaining_quota": 10,  # 赠送10次免费配额
        "total_quota": 10,
        "created_at": datetime.now().isoformat(),
        "last_login_at": None
    }

    users_db[user_id] = new_user

    # 生成token
    access_token = create_access_token(user_id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

async def login_user_endpoint(request: UserLogin):
    """用户登录"""
    # 查找用户
    user = None
    for u in users_db.values():
        if u["username"] == request.username or u["email"] == request.username:
            user = u
            break

    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    # 验证密码
    password_hash = hash_password(request.password)
    if user["hashed_password"] != password_hash:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="用户已被禁用")

    # 更新最后登录时间
    user["last_login_at"] = datetime.now().isoformat()

    # 生成token
    access_token = create_access_token(user["user_id"])

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

async def get_me_endpoint(current_user: dict = Depends(get_current_user)):
    """获取当前用户信息"""
    return current_user

async def get_quota_endpoint(current_user: dict = Depends(get_current_user)):
    """获取配额信息"""
    used_quota = current_user["total_quota"] - current_user["remaining_quota"]
    quota_percentage = (used_quota / current_user["total_quota"] * 100) if current_user["total_quota"] > 0 else 0

    return {
        "remaining_quota": current_user["remaining_quota"],
        "total_quota": current_user["total_quota"],
        "used_quota": used_quota,
        "quota_percentage": round(quota_percentage, 2)
    }

async def get_packages_endpoint(is_active: bool = True):
    """获取套餐列表"""
    packages = [pkg for pkg in packages_db.values() if pkg["is_active"] == is_active]
    return packages

async def create_order_endpoint(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    """创建订单"""
    package = packages_db.get(order_data.package_id)
    if not package:
        raise HTTPException(status_code=404, detail="套餐不存在")

    if not package["is_active"]:
        raise HTTPException(status_code=400, detail="套餐已下架")

    order_id = f"order_{uuid.uuid4().hex[:16]}"
    new_order = {
        "order_id": order_id,
        "user_id": current_user["user_id"],
        "package_name": package["package_name"],
        "quota_amount": package["quota_amount"],
        "price": package["price"],
        "status": "pending",
        "payment_method": order_data.payment_method,
        "paid_at": None,
        "created_at": datetime.now().isoformat()
    }

    orders_db[order_id] = new_order

    return new_order

async def pay_order_endpoint(order_id: str, current_user: dict = Depends(get_current_user)):
    """支付订单"""
    order = orders_db.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    if order["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="无权操作此订单")

    if order["status"] == "paid":
        raise HTTPException(status_code=400, detail="订单已支付")

    # 模拟支付成功
    order["status"] = "paid"
    order["paid_at"] = datetime.now().isoformat()
    order["transaction_id"] = f"txn_{uuid.uuid4().hex[:16]}"

    # 增加用户配额
    current_user["remaining_quota"] += order["quota_amount"]
    current_user["total_quota"] += order["quota_amount"]

    return {
        "message": "支付成功",
        "order_id": order_id,
        "quota_added": order["quota_amount"],
        "new_balance": current_user["remaining_quota"]
    }

async def get_orders_endpoint(page: int = 1, page_size: int = 10, current_user: dict = Depends(get_current_user)):
    """获取订单列表"""
    user_orders = [order for order in orders_db.values() if order["user_id"] == current_user["user_id"]]

    # 按创建时间倒序排序
    user_orders.sort(key=lambda x: x["created_at"], reverse=True)

    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    paginated_orders = user_orders[start:end]

    return {
        "orders": paginated_orders,
        "total": len(user_orders),
        "page": page,
        "page_size": page_size
    }

async def get_all_users_endpoint(current_user: dict = Depends(get_current_user)):
    """获取所有用户 (管理员)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")

    return list(users_db.values())

async def update_user_quota_endpoint(user_id: str, quota_update: dict, current_user: dict = Depends(get_current_user)):
    """更新用户配额 (管理员)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")

    user = users_db.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    amount = quota_update.get("amount", 0)
    user["remaining_quota"] += amount
    user["total_quota"] += amount

    return {
        "message": "配额更新成功",
        "user_id": user_id,
        "amount_added": amount,
        "new_balance": user["remaining_quota"],
        "reason": quota_update.get("reason", "")
    }
