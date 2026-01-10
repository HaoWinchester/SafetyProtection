#!/usr/bin/env python3
"""
创建检测模式数据库表
"""
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "safety_detection_db",
    "user": "safety_user",
    "password": "safety_pass_2024"
}

def get_db_connection():
    """获取数据库连接"""
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        return conn
    except Exception as e:
        print(f"数据库连接失败: {e}")
        return None

def create_tables():
    """创建数据库表"""
    conn = get_db_connection()
    if not conn:
        return False

    try:
        cursor = conn.cursor()

        # 读取SQL文件
        with open('create_detection_patterns_db.sql', 'r') as f:
            sql = f.read()

        # 分割并执行SQL语句
        statements = [s.strip() for s in sql.split(';') if s.strip()]

        for statement in statements:
            if statement:
                try:
                    cursor.execute(statement)
                except Exception as e:
                    print(f"执行SQL时出错: {e}")
                    print(f"语句: {statement[:100]}...")
                    # 继续执行其他语句

        conn.commit()
        print("✓ 数据库表创建成功")
        return True

    except Exception as e:
        print(f"创建表失败: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_tables()
