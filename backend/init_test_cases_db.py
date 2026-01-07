"""
初始化测试用例数据库脚本
Initialize Test Cases Database Script

将test_cases.py中的1033个测试用例导入到PostgreSQL数据库中
"""

import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
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
    get_test_cases
)

# 数据库配置
DATABASE_URL = "postgresql://safety_user:safety_pass@localhost:5432/safety_detection"

# 创建基类
Base = declarative_base()


class TestCase(Base):
    """测试用例模型"""
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(100), nullable=False, index=True)
    content = Column(Text, nullable=False)
    risk_level = Column(String(20), nullable=False)
    language = Column(String(20), default="mixed")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def init_database():
    """初始化数据库和表"""
    print("正在连接数据库...")
    engine = create_engine(DATABASE_URL, echo=True)

    print("创建表结构...")
    Base.metadata.create_all(engine)

    print("数据库初始化完成!")
    return engine


def import_test_cases():
    """导入所有测试用例到数据库"""
    engine = init_database()
    Session = sessionmaker(bind=engine)
    session = Session()

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

    total_imported = 0
    total_failed = 0

    print("\n开始导入测试用例...")
    print("=" * 70)

    for list_name, test_cases in test_case_lists.items():
        category, risk_level = category_mapping[list_name]

        print(f"\n导入类别: {category} ({len(test_cases)} 个用例)")

        for i, content in enumerate(test_cases, 1):
            try:
                # 检查是否已存在
                existing = session.query(TestCase).filter_by(
                    category=category,
                    content=content
                ).first()

                if not existing:
                    # 判断语言
                    if any('\u4e00' <= c <= '\u9fff' for c in content):
                        language = 'chinese'
                    elif any('\u3040' <= c <= '\u309f' or '\u30a0' <= c <= '\u30ff' for c in content):
                        language = 'japanese'
                    elif any('\uac00' <= c <= '\ud7af' for c in content):
                        language = 'korean'
                    elif any('\u0400' <= c <= '\u04ff' for c in content):
                        language = 'russian'
                    elif any('\u0590' <= c <= '\u05ff' for c in content):
                        language = 'arabic'
                    elif any('\u0041' <= c <= '\u005a' or '\u0061' <= c <= '\u007a' for c in content):
                        language = 'english'
                    else:
                        language = 'mixed'

                    test_case = TestCase(
                        category=category,
                        content=content,
                        risk_level=risk_level,
                        language=language
                    )
                    session.add(test_case)
                    total_imported += 1

                    if i % 50 == 0:
                        session.commit()
                        print(f"  已导入 {i}/{len(test_cases)} 个用例")
                else:
                    print(f"  跳过重复用例: {content[:50]}...")

            except Exception as e:
                print(f"  ❌ 导入失败: {content[:50]}... 错误: {str(e)}")
                total_failed += 1
                continue

        # 提交该类别的所有更改
        session.commit()
        print(f"  ✅ {category} 类别导入完成")

    session.commit()
    session.close()

    print("\n" + "=" * 70)
    print(f"导入完成!")
    print(f"成功导入: {total_imported} 个测试用例")
    print(f"失败: {total_failed} 个测试用例")
    print("=" * 70)


if __name__ == '__main__':
    try:
        import_test_cases()
        print("\n✅ 测试用例数据库初始化成功!")
    except Exception as e:
        print(f"\n❌ 初始化失败: {str(e)}")
        import traceback
        traceback.print_exc()
