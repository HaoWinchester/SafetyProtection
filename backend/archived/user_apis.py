"""
用户中心API - 数据库版本
替换 simple_server.py 中的所有内存操作API
"""
from fastapi import HTTPException, Depends
from typing import Optional, List
from pydantic import BaseModel
import hashlib
from datetime import datetime, date
import db_operations as db

# ==================== Pydantic Models ====================

class UserInfoUpdate(BaseModel):
    username: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    address: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class PackageSubscribe(BaseModel):
    package_id: str
    auto_renew: bool = False

class TicketCreate(BaseModel):
    type: str  # 'technical', 'billing', 'feature', 'bug'
    priority: str = 'medium'  # 'low', 'medium', 'high', 'urgent'
    subject: str
    description: str

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    resolution: Optional[str] = None

# ==================== 辅助函数 ====================

def get_user_id_from_token(current_user: dict) -> str:
    """从当前用户token中获取user_id"""
    return current_user.get("user_id", current_user.get("user_id", "unknown"))

# ==================== 用户管理API ====================

def get_all_users_api(current_user: dict):
    """获取所有用户 (管理员)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")

    users = db.get_all_users_from_db()
    return users

def update_user_quota_api(user_id: str, quota_update: dict, current_user: dict):
    """更新用户配额 (管理员)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")

    user = db.get_user_from_db(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    amount = quota_update.get("amount", 0)
    new_remaining = user['remaining_quota'] + amount
    new_total = user['total_quota'] + amount

    updated_user = db.update_user_in_db(user_id, {
        'remaining_quota': new_remaining,
        'total_quota': new_total
    })

    return {
        "message": "配额更新成功",
        "user_id": user_id,
        "amount_added": amount,
        "new_balance": new_remaining,
        "reason": quota_update.get("reason", "")
    }

def get_user_info_api(current_user: dict):
    """获取当前用户信息"""
    user_id = get_user_id_from_token(current_user)
    user = db.get_user_from_db(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 返回用户信息（不包含密码）
    user.pop('password_hash', None)
    return user

def update_user_info_api(user_info: UserInfoUpdate, current_user: dict):
    """更新用户信息"""
    user_id = get_user_id_from_token(current_user)

    # 构建更新数据（只包含提供的字段）
    update_data = {k: v for k, v in user_info.dict().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="没有提供更新数据")

    updated_user = db.update_user_in_db(user_id, update_data)

    if not updated_user:
        raise HTTPException(status_code=404, detail="用户不存在")

    updated_user.pop('password_hash', None)
    return {
        "message": "用户信息更新成功",
        "user": updated_user
    }

def change_password_api(password_data: PasswordChange, current_user: dict):
    """修改密码"""
    user_id = get_user_id_from_token(current_user)
    user = db.get_user_from_db(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 验证旧密码
    old_hashed = hashlib.sha256(password_data.old_password.encode()).hexdigest()
    if user['password_hash'] != old_hashed:
        raise HTTPException(status_code=400, detail="原密码错误")

    # 更新为新密码
    new_hashed = hashlib.sha256(password_data.new_password.encode()).hexdigest()
    db.update_user_in_db(user_id, {'password_hash': new_hashed})

    return {"message": "密码修改成功"}

# ==================== 订单管理API ====================

def get_bills_api(current_user: dict, limit: int = 10, offset: int = 0):
    """获取用户账单"""
    user_id = get_user_id_from_token(current_user)

    # 获取用户订单
    orders = db.get_user_orders_from_db(user_id, limit, offset)

    # 同时查询bills表获取账单信息
    conn = db.get_db_connection()
    cursor = conn.cursor(cursor_factory=db.psycopg2.extras.RealDictCursor)

    try:
        cursor.execute("""
            SELECT * FROM bills
            WHERE user_id = %s
            ORDER BY create_time DESC
            LIMIT %s OFFSET %s
        """, (user_id, limit, offset))

        bills = cursor.fetchall()
        cursor.close()
        conn.close()

        return {
            "bills": [dict(bill) for bill in bills],
            "orders": orders
        }
    except Exception as e:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=500, detail=f"查询账单失败: {str(e)}")

# ==================== 实名认证API ====================

def get_verify_status_api(current_user: dict):
    """获取实名认证状态"""
    user_id = get_user_id_from_token(current_user)

    conn = db.get_db_connection()
    cursor = conn.cursor(cursor_factory=db.psycopg2.extras.RealDictCursor)

    try:
        cursor.execute("SELECT * FROM verifications WHERE user_id = %s", (user_id,))
        verification = cursor.fetchone()
        cursor.close()
        conn.close()

        if not verification:
            return {
                "verified": False,
                "status": "not_submitted",
                "message": "未提交认证"
            }

        return dict(verification)
    except Exception as e:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=500, detail=f"查询认证状态失败: {str(e)}")

# ==================== 套餐订阅API ====================

def get_packages_api():
    """获取所有可用套餐"""
    packages = db.get_all_packages_from_db()
    return {
        "packages": packages,
        "total": len(packages)
    }

def get_subscription_overview_api(current_user: dict):
    """获取用户订阅概览"""
    user_id = get_user_id_from_token(current_user)

    # 获取用户订阅
    subscription = db.get_user_subscription_from_db(user_id)
    user = db.get_user_from_db(user_id)

    return {
        "subscription": subscription,
        "remaining_quota": user['remaining_quota'] if user else 0,
        "total_quota": user['total_quota'] if user else 0
    }

def subscribe_package_api(subscribe_data: PackageSubscribe, current_user: dict):
    """订阅套餐"""
    user_id = get_user_id_from_token(current_user)

    # 获取套餐信息
    package = db.get_package_from_db(subscribe_data.package_id)
    if not package:
        raise HTTPException(status_code=404, detail="套餐不存在")

    # 检查是否已有活跃订阅
    existing_subscription = db.get_user_subscription_from_db(user_id)
    if existing_subscription:
        raise HTTPException(status_code=400, detail="已有活跃订阅，请先取消当前订阅")

    # 创建新订阅
    from datetime import timedelta
    start_date = date.today()
    end_date = start_date + timedelta(days=package.get('duration_days', 30))

    subscription = db.create_subscription_in_db({
        'user_id': user_id,
        'package_id': package['id'],
        'plan_name': package['name'],
        'status': 'active',
        'start_date': start_date,
        'end_date': end_date,
        'auto_renew': subscribe_data.auto_renew,
        'quota_amount': package['quota_amount'],
        'remaining_quota': package['quota_amount'],
        'price': package['price']
    })

    # 更新用户配额
    db.update_user_in_db(user_id, {
        'remaining_quota': package['quota_amount'],
        'total_quota': package['quota_amount']
    })

    return {
        "message": "订阅成功",
        "subscription": subscription
    }

# ==================== 使用记录API ====================

def get_usage_records_api(current_user: dict, start_date: Optional[date] = None, end_date: Optional[date] = None, limit: int = 50):
    """获取使用记录"""
    user_id = get_user_id_from_token(current_user)

    records = db.get_user_usage_records_from_db(user_id, start_date, end_date, limit)

    return {
        "records": records,
        "total": len(records)
    }

def get_detection_usage_stats_api(current_user: dict, days: int = 7):
    """获取检测使用统计"""
    user_id = get_user_id_from_token(current_user)

    stats = db.get_detection_usage_stats_from_db(user_id, days)

    return {
        "stats": stats,
        "days": days
    }

# ==================== 工单管理API ====================

def get_tickets_api(current_user: dict, status: Optional[str] = None, limit: int = 10):
    """获取用户工单"""
    user_id = get_user_id_from_token(current_user)

    tickets = db.get_user_tickets_from_db(user_id, status, limit)

    return {
        "tickets": tickets,
        "total": len(tickets)
    }

def create_ticket_api(ticket_data: TicketCreate, current_user: dict):
    """创建工单"""
    user_id = get_user_id_from_token(current_user)

    ticket = db.create_ticket_in_db({
        'user_id': user_id,
        'type': ticket_data.type,
        'priority': ticket_data.priority,
        'subject': ticket_data.subject,
        'description': ticket_data.description
    })

    return {
        "message": "工单创建成功",
        "ticket": ticket
    }

def get_ticket_detail_api(ticket_id: str, current_user: dict):
    """获取工单详情"""
    user_id = get_user_id_from_token(current_user)

    conn = db.get_db_connection()
    cursor = conn.cursor(cursor_factory=db.psycopg2.extras.RealDictCursor)

    try:
        cursor.execute("SELECT * FROM tickets WHERE id = %s AND user_id = %s", (ticket_id, user_id))
        ticket = cursor.fetchone()
        cursor.close()
        conn.close()

        if not ticket:
            raise HTTPException(status_code=404, detail="工单不存在")

        return dict(ticket)
    except HTTPException:
        raise
    except Exception as e:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=500, detail=f"查询工单失败: {str(e)}")

def update_ticket_api(ticket_id: str, update_data: TicketUpdate, current_user: dict):
    """更新工单"""
    user_id = get_user_id_from_token(current_user)

    # 验证工单所有权
    conn = db.get_db_connection()
    cursor = conn.cursor(cursor_factory=db.psycopg2.extras.RealDictCursor)

    try:
        cursor.execute("SELECT id FROM tickets WHERE id = %s AND user_id = %s", (ticket_id, user_id))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="工单不存在")
        cursor.close()
        conn.close()
    except HTTPException:
        raise
    except Exception as e:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=500, detail=f"查询工单失败: {str(e)}")

    # 更新工单
    updated_ticket = db.update_ticket_in_db(ticket_id, {
        k: v for k, v in update_data.dict().items() if v is not None
    })

    if not updated_ticket:
        raise HTTPException(status_code=404, detail="工单不存在")

    return {
        "message": "工单更新成功",
        "ticket": updated_ticket
    }

# ==================== 系统设置API ====================

def get_system_settings_api(category: Optional[str] = None):
    """获取系统设置（仅公开设置）"""
    settings = db.get_all_settings_from_db(category, public_only=True)
    return {
        "settings": settings
    }

def update_system_settings_api(key: str, value: any, current_user: dict):
    """更新系统设置（仅管理员）"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")

    success = db.set_setting_in_db(key, value)

    if not success:
        raise HTTPException(status_code=500, detail="设置保存失败")

    return {
        "message": "设置更新成功",
        "key": key,
        "value": value
    }
