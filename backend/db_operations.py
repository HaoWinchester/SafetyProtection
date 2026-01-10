#!/usr/bin/env python3
"""
数据库操作辅助函数
提供所有数据库操作的统一接口，替代内存字典
"""
import psycopg2
from psycopg2.extras import RealDictCursor, DictCursor
from datetime import datetime, date
from typing import Dict, List, Optional, Any
import secrets
import hashlib

# 数据库配置
DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "safety_detection_db",
    "user": "safety_user",
    "password": "safety_pass_2024"
}

def get_db_connection():
    """获取数据库连接"""
    return psycopg2.connect(**DATABASE_CONFIG)

def get_db_cursor(conn, dict_cursor=True):
    """获取数据库游标"""
    if dict_cursor:
        return conn.cursor(cursor_factory=RealDictCursor)
    return conn.cursor()

# ==================== 用户管理 ====================

def get_user_from_db(user_id: str) -> Optional[Dict]:
    """从数据库获取用户信息"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        return dict(user) if user else None
    finally:
        cursor.close()
        conn.close()

def get_all_users_from_db() -> List[Dict]:
    """从数据库获取所有用户"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        cursor.execute("SELECT * FROM users ORDER BY create_time DESC")
        users = cursor.fetchall()
        return [dict(user) for user in users]
    finally:
        cursor.close()
        conn.close()

def create_user_in_db(user_data: Dict) -> Dict:
    """在数据库中创建新用户"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        user_id = user_data.get('user_id') or f"user_{secrets.token_hex(8)}"
        cursor.execute("""
            INSERT INTO users (
                user_id, username, email, password_hash, phone, real_name,
                company, position, address, verified, avatar, balance,
                remaining_quota, total_quota, role, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            user_id,
            user_data['username'],
            user_data['email'],
            user_data.get('password_hash', 'hashed_password'),
            user_data.get('phone'),
            user_data.get('real_name'),
            user_data.get('company'),
            user_data.get('position'),
            user_data.get('address'),
            user_data.get('verified', False),
            user_data.get('avatar'),
            user_data.get('balance', 0.0),
            user_data.get('remaining_quota', 10000),
            user_data.get('total_quota', 10000),
            user_data.get('role', 'user'),
            user_data.get('status', 'active')
        ))
        conn.commit()
        return dict(cursor.fetchone())
    finally:
        cursor.close()
        conn.close()

def update_user_in_db(user_id: str, update_data: Dict) -> Optional[Dict]:
    """更新数据库中的用户信息"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        # 构建动态UPDATE语句
        set_clause = []
        values = []
        for key, value in update_data.items():
            set_clause.append(f"{key} = %s")
            values.append(value)

        values.append(user_id)
        sql = f"UPDATE users SET {', '.join(set_clause)}, update_time = CURRENT_TIMESTAMP WHERE user_id = %s RETURNING *"
        cursor.execute(sql, values)
        conn.commit()

        result = cursor.fetchone()
        return dict(result) if result else None
    finally:
        cursor.close()
        conn.close()

def delete_user_from_db(user_id: str) -> bool:
    """从数据库删除用户"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn, dict_cursor=False)

    try:
        cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
        conn.close()

# ==================== 订单管理 ====================

def create_order_in_db(order_data: Dict) -> Dict:
    """在数据库中创建订单"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        order_id = order_data.get('id') or f"order_{secrets.token_hex(8)}"
        order_no = order_data.get('order_no') or f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}{secrets.token_hex(4).upper()}"

        cursor.execute("""
            INSERT INTO orders (
                id, order_no, user_id, package_id, type, amount, status,
                payment_method, payment_time, description
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            order_id,
            order_no,
            order_data['user_id'],
            order_data.get('package_id'),
            order_data['type'],
            order_data['amount'],
            order_data.get('status', 'pending'),
            order_data.get('payment_method'),
            order_data.get('payment_time'),
            order_data.get('description')
        ))
        conn.commit()
        return dict(cursor.fetchone())
    finally:
        cursor.close()
        conn.close()

def get_user_orders_from_db(user_id: str, limit: int = 10, offset: int = 0) -> List[Dict]:
    """获取用户订单列表"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        cursor.execute("""
            SELECT * FROM orders
            WHERE user_id = %s
            ORDER BY create_time DESC
            LIMIT %s OFFSET %s
        """, (user_id, limit, offset))
        orders = cursor.fetchall()
        return [dict(order) for order in orders]
    finally:
        cursor.close()
        conn.close()

def update_order_in_db(order_id: str, update_data: Dict) -> Optional[Dict]:
    """更新订单信息"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        set_clause = []
        values = []
        for key, value in update_data.items():
            set_clause.append(f"{key} = %s")
            values.append(value)

        values.append(order_id)
        sql = f"UPDATE orders SET {', '.join(set_clause)}, update_time = CURRENT_TIMESTAMP WHERE id = %s RETURNING *"
        cursor.execute(sql, values)
        conn.commit()

        result = cursor.fetchone()
        return dict(result) if result else None
    finally:
        cursor.close()
        conn.close()

# ==================== 套餐管理 ====================

def get_all_packages_from_db() -> List[Dict]:
    """获取所有套餐"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        cursor.execute("SELECT * FROM packages WHERE status = 'active' ORDER BY sort_order, price")
        packages = cursor.fetchall()
        return [dict(pkg) for pkg in packages]
    finally:
        cursor.close()
        conn.close()

def get_package_from_db(package_id: str) -> Optional[Dict]:
    """获取单个套餐"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        cursor.execute("SELECT * FROM packages WHERE id = %s", (package_id,))
        pkg = cursor.fetchone()
        return dict(pkg) if pkg else None
    finally:
        cursor.close()
        conn.close()

# ==================== 工单管理 ====================

def create_ticket_in_db(ticket_data: Dict) -> Dict:
    """创建工单"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        ticket_id = ticket_data.get('id') or f"ticket_{secrets.token_hex(8)}"
        ticket_no = ticket_data.get('ticket_no') or f"TKT{datetime.now().strftime('%Y%m%d%H%M%S')}{secrets.token_hex(4).upper()}"

        cursor.execute("""
            INSERT INTO tickets (
                id, ticket_no, user_id, type, priority, subject, description, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            ticket_id,
            ticket_no,
            ticket_data['user_id'],
            ticket_data['type'],
            ticket_data.get('priority', 'medium'),
            ticket_data['subject'],
            ticket_data['description'],
            ticket_data.get('status', 'open')
        ))
        conn.commit()
        return dict(cursor.fetchone())
    finally:
        cursor.close()
        conn.close()

def get_user_tickets_from_db(user_id: str, status: Optional[str] = None, limit: int = 10) -> List[Dict]:
    """获取用户工单"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        if status:
            cursor.execute("""
                SELECT * FROM tickets
                WHERE user_id = %s AND status = %s
                ORDER BY create_time DESC
                LIMIT %s
            """, (user_id, status, limit))
        else:
            cursor.execute("""
                SELECT * FROM tickets
                WHERE user_id = %s
                ORDER BY create_time DESC
                LIMIT %s
            """, (user_id, limit))

        tickets = cursor.fetchall()
        return [dict(ticket) for ticket in tickets]
    finally:
        cursor.close()
        conn.close()

def update_ticket_in_db(ticket_id: str, update_data: Dict) -> Optional[Dict]:
    """更新工单"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        set_clause = []
        values = []
        for key, value in update_data.items():
            set_clause.append(f"{key} = %s")
            values.append(value)

        values.append(ticket_id)
        sql = f"UPDATE tickets SET {', '.join(set_clause)}, update_time = CURRENT_TIMESTAMP WHERE id = %s RETURNING *"
        cursor.execute(sql, values)
        conn.commit()

        result = cursor.fetchone()
        return dict(result) if result else None
    finally:
        cursor.close()
        conn.close()

# ==================== 使用记录管理 ====================

def create_usage_record_in_db(record_data: Dict) -> Dict:
    """创建使用记录"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        record_id = record_data.get('id') or f"record_{secrets.token_hex(8)}"
        cursor.execute("""
            INSERT INTO usage_records (
                id, user_id, api_key_id, request_type, request_text,
                response_size, risk_score, is_compliant, processing_time_ms,
                ip_address, user_agent
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            record_id,
            record_data['user_id'],
            record_data.get('api_key_id'),
            record_data['request_type'],
            record_data.get('request_text'),
            record_data.get('response_size'),
            record_data.get('risk_score'),
            record_data.get('is_compliant'),
            record_data.get('processing_time_ms'),
            record_data.get('ip_address'),
            record_data.get('user_agent')
        ))
        conn.commit()
        return dict(cursor.fetchone())
    finally:
        cursor.close()
        conn.close()

def get_user_usage_records_from_db(user_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None, limit: int = 50) -> List[Dict]:
    """获取用户使用记录"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        if start_date and end_date:
            cursor.execute("""
                SELECT * FROM usage_records
                WHERE user_id = %s AND create_time >= %s AND create_time <= %s
                ORDER BY create_time DESC
                LIMIT %s
            """, (user_id, start_date, end_date, limit))
        else:
            cursor.execute("""
                SELECT * FROM usage_records
                WHERE user_id = %s
                ORDER BY create_time DESC
                LIMIT %s
            """, (user_id, limit))

        records = cursor.fetchall()
        return [dict(record) for record in records]
    finally:
        cursor.close()
        conn.close()

# ==================== 订阅管理 ====================

def create_subscription_in_db(subscription_data: Dict) -> Dict:
    """创建订阅"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        subscription_id = subscription_data.get('id') or f"sub_{secrets.token_hex(8)}"
        cursor.execute("""
            INSERT INTO subscriptions (
                id, user_id, package_id, plan_name, status, start_date, end_date,
                auto_renew, quota_amount, remaining_quota, price
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            subscription_id,
            subscription_data['user_id'],
            subscription_data['package_id'],
            subscription_data['plan_name'],
            subscription_data.get('status', 'active'),
            subscription_data['start_date'],
            subscription_data.get('end_date'),
            subscription_data.get('auto_renew', False),
            subscription_data['quota_amount'],
            subscription_data['remaining_quota'],
            subscription_data.get('price')
        ))
        conn.commit()
        return dict(cursor.fetchone())
    finally:
        cursor.close()
        conn.close()

def get_user_subscription_from_db(user_id: str) -> Optional[Dict]:
    """获取用户当前订阅"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        cursor.execute("""
            SELECT * FROM subscriptions
            WHERE user_id = %s AND status = 'active'
            ORDER BY create_time DESC
            LIMIT 1
        """, (user_id,))
        subscription = cursor.fetchone()
        return dict(subscription) if subscription else None
    finally:
        cursor.close()
        conn.close()

# ==================== 系统设置管理 ====================

def get_setting_from_db(key: str) -> Optional[Any]:
    """获取系统设置"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        cursor.execute("SELECT * FROM settings WHERE key = %s", (key,))
        setting = cursor.fetchone()

        if not setting:
            return None

        value = setting['value']
        setting_type = setting['type']

        # 类型转换
        if setting_type == 'number':
            return int(value) if '.' not in value else float(value)
        elif setting_type == 'boolean':
            return value.lower() in ('true', '1', 'yes')
        elif setting_type == 'json':
            import json
            return json.loads(value)
        else:
            return value
    finally:
        cursor.close()
        conn.close()

def set_setting_in_db(key: str, value: Any, description: Optional[str] = None, type: str = 'string', category: str = 'system', is_public: bool = False) -> bool:
    """设置系统配置"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn, dict_cursor=False)

    try:
        # 转换值为字符串
        if isinstance(value, bool):
            value = str(value)
        elif isinstance(value, (dict, list)):
            import json
            value = json.dumps(value)
        else:
            value = str(value)

        cursor.execute("""
            INSERT INTO settings (key, value, description, type, category, is_public)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (key) DO UPDATE SET
                value = EXCLUDED.value,
                description = COALESCE(EXCLUDED.description, settings.description),
                update_time = CURRENT_TIMESTAMP
        """, (key, value, description, type, category, is_public))

        conn.commit()
        return True
    except Exception as e:
        print(f"设置保存失败: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def get_all_settings_from_db(category: Optional[str] = None, public_only: bool = False) -> Dict[str, Any]:
    """获取所有系统设置"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        if category and public_only:
            cursor.execute("SELECT * FROM settings WHERE category = %s AND is_public = TRUE", (category,))
        elif category:
            cursor.execute("SELECT * FROM settings WHERE category = %s", (category,))
        elif public_only:
            cursor.execute("SELECT * FROM settings WHERE is_public = TRUE")
        else:
            cursor.execute("SELECT * FROM settings")

        settings = cursor.fetchall()
        result = {}
        for setting in settings:
            key = setting['key']
            value = setting['value']
            setting_type = setting['type']

            # 跳过NULL值和字符串"None"
            if value is None or str(value).lower() == 'none':
                continue

            # 类型转换
            if setting_type == 'number':
                result[key] = int(value) if '.' not in str(value) else float(value)
            elif setting_type == 'boolean':
                result[key] = str(value).lower() in ('true', '1', 'yes')
            elif setting_type == 'json':
                import json
                result[key] = json.loads(value)
            else:
                result[key] = value

        return result
    finally:
        cursor.close()
        conn.close()

# ==================== 检测使用统计 ====================

def update_detection_usage_in_db(user_id: str, is_compliant: bool, risk_score: float, processing_time_ms: int) -> bool:
    """更新检测使用统计"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn, dict_cursor=False)

    try:
        today = date.today()

        # 先尝试更新
        cursor.execute("""
            UPDATE detection_usage
            SET
                total_calls = total_calls + 1,
                compliant_calls = compliant_calls + %s,
                risky_calls = risky_calls + %s,
                avg_risk_score = (avg_risk_score * total_calls + %s) / (total_calls + 1),
                total_processing_time_ms = total_processing_time_ms + %s,
                update_time = CURRENT_TIMESTAMP
            WHERE user_id = %s AND date = %s
        """, (
            1 if is_compliant else 0,
            0 if is_compliant else 1,
            risk_score,
            processing_time_ms,
            user_id,
            today
        ))

        if cursor.rowcount == 0:
            # 如果没有记录，创建新记录
            cursor.execute("""
                INSERT INTO detection_usage (id, user_id, date, total_calls, compliant_calls, risky_calls, avg_risk_score, total_processing_time_ms)
                VALUES (%s, %s, %s, 1, %s, %s, %s, %s)
            """, (
                f"usage_{user_id}_{today.isoformat()}",
                user_id,
                today,
                1 if is_compliant else 0,
                0 if is_compliant else 1,
                risk_score,
                processing_time_ms
            ))

        conn.commit()
        return True
    except Exception as e:
        print(f"更新检测统计失败: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def get_detection_usage_stats_from_db(user_id: str, days: int = 7) -> List[Dict]:
    """获取检测使用统计"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)

    try:
        cursor.execute("""
            SELECT * FROM detection_usage
            WHERE user_id = %s AND date >= CURRENT_DATE - INTERVAL '%s days'
            ORDER BY date DESC
        """, (user_id, days))

        stats = cursor.fetchall()
        return [dict(stat) for stat in stats]
    finally:
        cursor.close()
        conn.close()

# ==================== 便捷函数 ====================

def init_database_with_test_data():
    """初始化数据库测试数据"""
    print("正在初始化数据库测试数据...")

    # 默认管理员账户已在 init_db.sql 中创建
    print("✓ 默认管理员账户已创建")

    # 测试用户
    test_users = [
        {
            'username': 'testuser1',
            'email': 'test1@example.com',
            'role': 'user',
            'remaining_quota': 50000,
            'total_quota': 50000
        },
        {
            'username': 'testuser2',
            'email': 'test2@example.com',
            'role': 'user',
            'remaining_quota': 100000,
            'total_quota': 100000
        }
    ]

    for user_data in test_users:
        try:
            create_user_in_db(user_data)
            print(f"✓ 创建测试用户: {user_data['username']}")
        except Exception as e:
            print(f"用户可能已存在: {user_data['username']} ({e})")

    print("✓ 数据库初始化完成")

if __name__ == "__main__":
    # 测试数据库连接
    try:
        conn = get_db_connection()
        cursor = get_db_cursor(conn)
        cursor.execute("SELECT version()")
        version = cursor.fetchone()
        print(f"✓ 数据库连接成功: {version['version'][:50]}...")
        cursor.close()
        conn.close()

        # 初始化测试数据
        init_database_with_test_data()

    except Exception as e:
        print(f"✗ 数据库连接失败: {e}")
