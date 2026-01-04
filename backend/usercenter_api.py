"""
用户中心API扩展
User Center API Extension
"""

from fastapi import HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from simple_server import (
    app, get_current_user, users_db, orders_db, packages_db,
    security, HTTPAuthorizationCredentials
)

# ===== 数据模型 =====

class VerificationSubmit(BaseModel):
    real_name: str
    id_card: str
    company: Optional[str] = None
    position: Optional[str] = None

class AuthItem(BaseModel):
    name: str
    app_id: str
    permissions: List[str]
    callback_url: Optional[str] = None

class TicketCreate(BaseModel):
    title: str
    category: str
    priority: str = "medium"
    description: str

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    response: Optional[str] = None

# ===== 内存数据库 =====

verification_db = {}  # 认证申请
auth_app_db = {}  # 授权应用
tickets_db = {}  # 工单
usage_records_db = []  # 使用记录
subscription_db = {}  # 用户订阅

# ===== 辅助函数 =====

def get_user_subscriptions(user_id: str):
    """获取用户订阅"""
    if user_id not in subscription_db:
        subscription_db[user_id] = {
            "package_id": None,
            "status": "free",
            "start_date": None,
            "end_date": None,
            "auto_renew": False,
        }
    return subscription_db[user_id]

# ===== API端点 =====

# 1. 设置模块

@app.get("/api/v1/user/account")
async def get_account_info(current_user: dict = Depends(get_current_user)):
    """获取账号信息"""
    user = users_db.get(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    return {
        "user_id": user["user_id"],
        "username": user["username"],
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "real_name": user.get("real_name", ""),
        "id_card": user.get("id_card", ""),
        "company": user.get("company", ""),
        "position": user.get("position", ""),
        "address": user.get("address", ""),
        "verified": user.get("verified", False),
        "created_at": user.get("create_time"),
    }

@app.post("/api/v1/user/verify")
async def submit_verification(
    verification_data: VerificationSubmit,
    current_user: dict = Depends(get_current_user)
):
    """提交实名认证"""
    user_id = current_user["user_id"]
    
    # 检查是否已认证
    user = users_db.get(user_id)
    if user.get("verified", False):
        raise HTTPException(status_code=400, detail="用户已完成实名认证")
    
    # 创建认证申请
    verification_id = f"verify_{user_id}_{int(datetime.now().timestamp())}"
    verification_db[verification_id] = {
        "verification_id": verification_id,
        "user_id": user_id,
        "real_name": verification_data.real_name,
        "id_card": verification_data.id_card,
        "company": verification_data.company,
        "position": verification_data.position,
        "status": "pending",  # pending, approved, rejected
        "submit_time": datetime.now().isoformat(),
        "review_time": None,
        "reviewer": None,
    }
    
    return {
        "verification_id": verification_id,
        "message": "实名认证申请已提交,请等待审核",
        "status": "pending"
    }

@app.get("/api/v1/user/verify-status")
async def get_verify_status(current_user: dict = Depends(get_current_user)):
    """获取实名认证状态"""
    user = users_db.get(current_user["user_id"])
    
    # 查找最新的认证申请
    user_verifications = [
        v for v in verification_db.values()
        if v["user_id"] == current_user["user_id"]
    ]
    
    if not user_verifications:
        return {
            "verified": False,
            "status": "not_submitted",
            "real_name": None,
        }
    
    latest = sorted(user_verifications, key=lambda x: x["submit_time"], reverse=True)[0]
    
    return {
        "verified": latest["status"] == "approved",
        "status": latest["status"],
        "real_name": latest["real_name"] if latest["status"] == "approved" else None,
        "submit_time": latest["submit_time"],
        "reject_reason": latest.get("reject_reason"),
    }

@app.get("/api/v1/user/auth")
async def get_auth_list(current_user: dict = Depends(get_current_user)):
    """获取授权列表"""
    user_auths = [
        auth for auth in auth_app_db.values()
        if auth.get("user_id") == current_user["user_id"]
    ]
    
    return {
        "total": len(user_auths),
        "items": user_auths
    }

@app.post("/api/v1/user/auth")
async def create_auth(
    auth_data: AuthItem,
    current_user: dict = Depends(get_current_user)
):
    """创建授权应用"""
    auth_id = f"auth_{current_user['user_id']}_{int(datetime.now().timestamp())}"
    
    auth_app_db[auth_id] = {
        "auth_id": auth_id,
        "user_id": current_user["user_id"],
        "name": auth_data.name,
        "app_id": auth_data.app_id,
        "permissions": auth_data.permissions,
        "callback_url": auth_data.callback_url,
        "created_at": datetime.now().isoformat(),
        "status": "active",
    }
    
    return {"message": "授权应用创建成功", "auth_id": auth_id}

@app.delete("/api/v1/user/auth/{auth_id}")
async def delete_auth(
    auth_id: str,
    current_user: dict = Depends(get_current_user)
):
    """删除授权应用"""
    if auth_id not in auth_app_db:
        raise HTTPException(status_code=404, detail="授权应用不存在")
    
    if auth_app_db[auth_id]["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="无权删除此授权")
    
    del auth_app_db[auth_id]
    
    return {"message": "授权应用已删除"}

# 2. 编程套餐模块

@app.get("/api/v1/user/subscription/overview")
async def get_subscription_overview(current_user: dict = Depends(get_current_user)):
    """获取套餐总览"""
    user = users_db.get(current_user["user_id"])
    subscription = get_user_subscriptions(current_user["user_id"])
    
    # 计算用量统计
    user_usage = [
        r for r in usage_records_db
        if r.get("user_id") == current_user["user_id"]
    ]
    
    total_tokens = sum(r.get("tokens", 0) for r in user_usage)
    
    # 获取套餐信息
    package = None
    if subscription["package_id"]:
        package = packages_db.get(subscription["package_id"])
    
    return {
        "package_name": package["package_name"] if package else "免费版",
        "status": subscription["status"],
        "end_date": subscription["end_date"],
        "auto_renew": subscription.get("auto_renew", False),
        "total_quota": package.get("quota_amount", 50) if package else 50,
        "used_quota": total_tokens,
        "remaining_quota": (package.get("quota_amount", 50) if package else 50) - total_tokens,
    }

@app.get("/api/v1/user/packages")
async def get_user_packages(current_user: dict = Depends(get_current_user)):
    """获取我的套餐列表"""
    subscription = get_user_subscriptions(current_user["user_id"])
    
    packages = list(packages_db.values())
    
    # 标记当前订阅的套餐
    for pkg in packages:
        pkg["is_subscribed"] = (pkg["package_id"] == subscription["package_id"])
        pkg["can_subscribe"] = True
    
    return {
        "current_package_id": subscription["package_id"],
        "packages": packages
    }

@app.post("/api/v1/user/packages/subscribe")
async def subscribe_package(
    package_id: str,
    current_user: dict = Depends(get_current_user)
):
    """订阅套餐"""
    if package_id not in packages_db:
        raise HTTPException(status_code=404, detail="套餐不存在")
    
    package = packages_db[package_id]
    
    # 更新用户订阅
    user_id = current_user["user_id"]
    subscription = get_user_subscriptions(user_id)
    
    subscription.update({
        "package_id": package_id,
        "status": "active",
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now() + timedelta(days=90)).isoformat(),
        "auto_renew": False,
    })
    
    # 更新用户配额
    users_db[user_id]["total_quota"] = package["quota_amount"]
    users_db[user_id]["remaining_quota"] = package["quota_amount"]
    
    return {
        "message": "套餐订阅成功",
        "package_name": package["package_name"],
        "end_date": subscription["end_date"]
    }

@app.post("/api/v1/user/packages/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """取消订阅"""
    user_id = current_user["user_id"]
    subscription = get_user_subscriptions(user_id)
    
    if subscription["package_id"] is None:
        raise HTTPException(status_code=400, detail="当前没有订阅套餐")
    
    subscription.update({
        "package_id": None,
        "status": "cancelled",
        "end_date": datetime.now().isoformat(),
    })
    
    # 重置为免费版配额
    users_db[user_id]["total_quota"] = 50
    users_db[user_id]["remaining_quota"] = 50
    
    return {"message": "套餐已取消"}

@app.get("/api/v1/user/usage")
async def get_usage_statistics(
    current_user: dict = Depends(get_current_user),
    days: int = 30
):
    """获取用量统计"""
    from datetime import timedelta
    
    start_date = datetime.now() - timedelta(days=days)
    
    user_usage = [
        r for r in usage_records_db
        if r.get("user_id") == current_user["user_id"]
        and datetime.fromisoformat(r["timestamp"]) >= start_date
    ]
    
    # 按天统计
    daily_usage = {}
    for record in user_usage:
        date = record["timestamp"][:10]
        if date not in daily_usage:
            daily_usage[date] = 0
        daily_usage[date] += record.get("tokens", 0)
    
    # 排序
    sorted_usage = [
        {"date": date, "tokens": daily_usage[date]}
        for date in sorted(daily_usage.keys())
    ]
    
    return {
        "period_days": days,
        "total_tokens": sum(r.get("tokens", 0) for r in user_usage),
        "total_requests": len(user_usage),
        "daily_usage": sorted_usage,
    }

# 3. 用户权益模块

@app.get("/api/v1/user/benefits")
async def get_benefits(current_user: dict = Depends(get_current_user)):
    """获取用户权益"""
    subscription = get_user_subscriptions(current_user["user_id"])
    package = packages_db.get(subscription["package_id"]) if subscription["package_id"] else None
    
    if not package:
        # 免费版权益
        benefits = [
            {"name": "基础API调用", "description": "每日50次免费调用额度", "included": True},
            {"name": "社区支持", "description": "访问技术社群获取帮助", "included": True},
            {"name": "基础文档", "description": "访问开发文档和教程", "included": True},
        ]
    else:
        # 付费版权益
        benefits = [
            {"name": "高速处理", "description": "比免费版快40%-60%", "included": True},
            {"name": "优先支持", "description": "7x24小时优先响应", "included": True},
            {"name": "视觉理解", "description": "图片理解和分析功能", "included": package.get("include_vision", False)},
            {"name": "联网搜索", "description": "实时网络搜索能力", "included": package.get("include_search", False)},
            {"name": "MCP集成", "description": "开源仓库集成", "included": package.get("include_mcp", False)},
            {"name": "模型更新", "description": "订阅期内享受最新旗舰模型", "included": True},
        ]
    
    return {
        "package_name": package["package_name"] if package else "免费版",
        "benefits": benefits
    }

# 4. 工单记录模块

@app.get("/api/v1/user/tickets")
async def get_tickets(
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """获取工单列表"""
    user_tickets = [
        t for t in tickets_db.values()
        if t["user_id"] == current_user["user_id"]
        and (status is None or t["status"] == status)
    ]
    
    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    paginated_tickets = sorted(user_tickets, key=lambda x: x["created_at"], reverse=True)[start:end]
    
    return {
        "total": len(user_tickets),
        "page": page,
        "page_size": page_size,
        "items": paginated_tickets
    }

@app.post("/api/v1/user/tickets")
async def create_ticket(
    ticket_data: TicketCreate,
    current_user: dict = Depends(get_current_user)
):
    """创建工单"""
    ticket_id = f"ticket_{int(datetime.now().timestamp())}"
    
    tickets_db[ticket_id] = {
        "ticket_id": ticket_id,
        "user_id": current_user["user_id"],
        "title": ticket_data.title,
        "category": ticket_data.category,
        "priority": ticket_data.priority,
        "description": ticket_data.description,
        "status": "open",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "response": None,
    }
    
    return {
        "message": "工单创建成功",
        "ticket_id": ticket_id
    }

@app.get("/api/v1/user/tickets/{ticket_id}")
async def get_ticket_detail(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):
    """获取工单详情"""
    if ticket_id not in tickets_db:
        raise HTTPException(status_code=404, detail="工单不存在")
    
    ticket = tickets_db[ticket_id]
    
    if ticket["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="无权查看此工单")
    
    return ticket

@app.put("/api/v1/user/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    ticket_data: TicketUpdate,
    current_user: dict = Depends(get_current_user)
):
    """更新工单"""
    if ticket_id not in tickets_db:
        raise HTTPException(status_code=404, detail="工单不存在")
    
    ticket = tickets_db[ticket_id]
    
    if ticket["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="无权更新此工单")
    
    if ticket_data.status:
        ticket["status"] = ticket_data.status
    if ticket_data.response:
        ticket["response"] = ticket_data.response
    ticket["updated_at"] = datetime.now().isoformat()
    
    return {"message": "工单更新成功"}

# 5. 帮助中心

@app.get("/api/v1/help/faq")
async def get_faq():
    """获取常见问题"""
    faqs = [
        {
            "id": "faq_1",
            "question": "如何获取API Key?",
            "answer": "进入'项目管理'->'API Keys',点击'添加新的API Key'即可创建。",
            "category": "API使用"
        },
        {
            "id": "faq_2",
            "question": "如何升级套餐?",
            "answer": "进入'编程套餐'->'我的套餐',选择合适的套餐进行订阅。",
            "category": "套餐订阅"
        },
        {
            "id": "faq_3",
            "question": "配额如何计算?",
            "answer": "不同套餐有不同的配额额度,每次API调用会消耗相应配额。具体请参考套餐说明。",
            "category": "计费说明"
        },
        {
            "id": "faq_4",
            "question": "如何查看用量统计?",
            "answer": "进入'编程套餐'->'用量统计',可以查看指定时间范围内的API调用情况。",
            "category": "使用帮助"
        },
    ]
    
    return {"faqs": faqs}

print("用户中心API扩展已加载!")
