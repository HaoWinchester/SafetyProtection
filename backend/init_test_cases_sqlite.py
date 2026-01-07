"""
初始化测试用例SQLite数据库脚本
Initialize Test Cases SQLite Database Script

将test_cases.py中的1033个测试用例导入到SQLite数据库中
"""

import sys
import os
import sqlite3
from datetime import datetime
from test_cases import (
    basic_jailbreaks,
    advanced_jailbreaks,
    flipattack_jailbreaks,
    data_exfiltration,
    tool_abuse,
    social_engineering,
    indirect_injection,
    multilingual_attacks,
    encoding_attacks,
    scenario_attacks,
    complex_attacks,
    targeted_attacks,
)

# SQLite数据库文件
DB_FILE = "test_cases.db"


def init_database():
    """初始化SQLite数据库和表"""
    print("正在初始化SQLite数据库...")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # 创建测试用例表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            content TEXT NOT NULL,
            risk_level TEXT NOT NULL,
            language TEXT DEFAULT 'mixed',
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 创建索引
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_category ON test_cases(category)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_content ON test_cases(content)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_risk_level ON test_cases(risk_level)
    """)

    conn.commit()
    conn.close()

    print("✅ SQLite数据库初始化完成!")
    print(f"数据库文件: {os.path.abspath(DB_FILE)}")


def detect_language(text):
    """检测文本语言"""
    if any('\u4e00' <= c <= '\u9fff' for c in text):
        return 'chinese'
    elif any('\u3040' <= c <= '\u309f' or '\u30a0' <= c <= '\u30ff' for c in text):
        return 'japanese'
    elif any('\uac00' <= c <= '\ud7af' for c in text):
        return 'korean'
    elif any('\u0400' <= c <= '\u04ff' for c in text):
        return 'russian'
    elif any('\u0590' <= c <= '\u05ff' for c in text):
        return 'arabic'
    elif any('\u0041' <= c <= '\u005a' or '\u0061' <= c <= '\u007a' for c in text):
        return 'english'
    else:
        return 'mixed'


def import_test_cases():
    """导入所有测试用例到数据库"""
    init_database()

    # 类别映射
    category_mapping = {
        'basic_jailbreaks': ('basic', 'high'),
        'advanced_jailbreaks': ('advanced', 'critical'),
        'flipattack_jailbreaks': ('flipattack', 'critical'),
        'data_exfiltration': ('exfiltration', 'high'),
        'tool_abuse': ('tool_abuse', 'critical'),
        'social_engineering': ('social', 'medium'),
        'indirect_injection': ('indirect', 'medium'),
        'multilingual_attacks': ('multilingual', 'medium'),
        'encoding_attacks': ('encoding', 'high'),
        'scenario_attacks': ('scenario', 'low'),
        'complex_attacks': ('complex', 'high'),
        'targeted_attacks': ('targeted', 'critical'),
    }

    # 测试用例列表
    test_case_lists = {
        'basic_jailbreaks': basic_jailbreaks,
        'advanced_jailbreaks': advanced_jailbreaks,
        'flipattack_jailbreaks': flipattack_jailbreaks,
        'data_exfiltration': data_exfiltration,
        'tool_abuse': tool_abuse,
        'social_engineering': social_engineering,
        'indirect_injection': indirect_injection,
        'multilingual_attacks': multilingual_attacks,
        'encoding_attacks': encoding_attacks,
        'scenario_attacks': scenario_attacks,
        'complex_attacks': complex_attacks,
        'targeted_attacks': targeted_attacks,
    }

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    total_imported = 0
    total_failed = 0
    total_skipped = 0

    print("\n开始导入测试用例...")
    print("=" * 70)

    for list_name, test_cases in test_case_lists.items():
        category, risk_level = category_mapping[list_name]

        print(f"\n导入类别: {category} ({len(test_cases)} 个用例)")

        for i, content in enumerate(test_cases, 1):
            try:
                # 检查是否已存在
                cursor.execute("""
                    SELECT id FROM test_cases
                    WHERE category = ? AND content = ?
                """, (category, content))

                if cursor.fetchone() is None:
                    # 检测语言
                    language = detect_language(content)

                    # 插入数据
                    cursor.execute("""
                        INSERT INTO test_cases (category, content, risk_level, language)
                        VALUES (?, ?, ?, ?)
                    """, (category, content, risk_level, language))

                    total_imported += 1

                    if i % 50 == 0:
                        conn.commit()
                        print(f"  已导入 {i}/{len(test_cases)} 个用例")
                else:
                    total_skipped += 1
                    if total_skipped <= 5:  # 只显示前5个重复
                        print(f"  跳过重复用例: {content[:50]}...")

            except Exception as e:
                print(f"  ❌ 导入失败: {content[:50]}... 错误: {str(e)}")
                total_failed += 1
                continue

        # 提交该类别的所有更改
        conn.commit()
        print(f"  ✅ {category} 类别导入完成")

    # 统计信息
    cursor.execute("SELECT COUNT(*) FROM test_cases")
    total_in_db = cursor.fetchone()[0]

    conn.close()

    print("\n" + "=" * 70)
    print(f"导入完成!")
    print(f"新导入: {total_imported} 个测试用例")
    print(f"跳过重复: {total_skipped} 个测试用例")
    print(f"失败: {total_failed} 个测试用例")
    print(f"数据库总数: {total_in_db} 个测试用例")
    print("=" * 70)


if __name__ == '__main__':
    try:
        import_test_cases()
        print("\n✅ 测试用例SQLite数据库初始化成功!")
        print(f"\n使用方法:")
        print(f"  python3 database_detection.py  # 运行检测")
    except Exception as e:
        print(f"\n❌ 初始化失败: {str(e)}")
        import traceback
        traceback.print_exc()
