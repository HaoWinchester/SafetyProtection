"""
Database initialization script.

This script creates all tables and seeds initial data.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base import Base
from app.models.detection import DetectionRecord, ThreatSample, DetectionRule, ViolationRecord
from app.models.evaluation import (
    EvaluationConfig,
    TestCase,
    EvaluationResult,
    EvaluationCaseResult
)
from app.scripts.seed_test_cases import seed_test_cases


async def init_database():
    """Initialize database with all tables and seed data."""
    print("=" * 60)
    print("数据库初始化开始")
    print("=" * 60)

    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=True
    )

    # Create all tables
    print("\n[1/4] 创建数据库表...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ 数据库表创建完成")

    # Create session
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    # Seed test cases
    print("\n[2/4] 初始化测试用例...")
    async with async_session() as session:
        created_count = await seed_test_cases(session)
        print(f"✅ 创建了 {created_count} 个测试用例")

    # Seed some detection rules
    print("\n[3/4] 初始化检测规则...")
    async with async_session() as session:
        from app.scripts.seed_rules import seed_detection_rules
        rule_count = await seed_detection_rules(session)
        print(f"✅ 创建了 {rule_count} 个检测规则")

    print("\n[4/4] 初始化完成!")
    print("=" * 60)
    print("\n数据库初始化成功完成!")
    print(f"数据库地址: {settings.DATABASE_URL}")
    print("\n您现在可以启动应用程序了。")

    await engine.dispose()


if __name__ == "__main__":
    import asyncio
    asyncio.run(init_database())
