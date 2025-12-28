"""
Initial detection rules seed data.
"""
from app.models.detection import DetectionRule
from app.models.detection import DetectionRule
from datetime import datetime


INITIAL_RULES = [
    {
        "rule_id": "rule_direct_injection_001",
        "rule_name": "直接指令覆盖检测",
        "rule_type": "keyword",
        "rule_pattern": "ignore.*previous.*instruction",
        "attack_type": "DIRECT_PROMPT_INJECTION",
        "severity": "high",
        "weight": 1.0,
        "description": "检测尝试忽略先前指令的关键词"
    },
    {
        "rule_id": "rule_direct_injection_002",
        "rule_name": "系统提示词劫持检测",
        "rule_type": "keyword",
        "rule_pattern": "system.*prompt",
        "attack_type": "DIRECT_PROMPT_INJECTION",
        "severity": "critical",
        "weight": 1.0,
        "description": "检测尝试获取系统提示词"
    },
    {
        "rule_id": "rule_jailbreak_001",
        "rule_name": "DAN越狱检测",
        "rule_type": "keyword",
        "rule_pattern": "\\bdan\\b.*do anything",
        "attack_type": "JAILBREAK",
        "severity": "critical",
        "weight": 1.0,
        "description": "检测DAN(Do Anything Now)越狱攻击"
    },
    {
        "rule_id": "rule_jailbreak_002",
        "rule_name": "开发者模式越狱检测",
        "rule_type": "keyword",
        "rule_pattern": "developer.*mode.*unrestricted",
        "attack_type": "JAILBREAK",
        "severity": "critical",
        "weight": 1.0,
        "description": "检测开发者模式越狱尝试"
    },
    {
        "rule_id": "rule_role_playing_001",
        "rule_name": "角色扮演攻击检测",
        "rule_type": "keyword",
        "rule_pattern": "you are (a|an) (hacker|attacker|criminal)",
        "attack_type": "ROLE_PLAYING",
        "severity": "high",
        "weight": 0.9,
        "description": "检测恶意角色扮演尝试"
    },
    {
        "rule_id": "rule_data_leakage_001",
        "rule_name": "敏感信息探测",
        "rule_type": "keyword",
        "rule_pattern": "(password|secret|api.?key)",
        "attack_type": "DATA_LEAKAGE",
        "severity": "medium",
        "weight": 0.7,
        "description": "检测敏感信息探测尝试"
    },
]


async def seed_detection_rules(db_session) -> int:
    """
    Seed initial detection rules to database.

    Args:
        db_session: Database session

    Returns:
        Number of rules created
    """
    from sqlalchemy import select

    created_count = 0

    for rule_data in INITIAL_RULES:
        # Check if already exists
        existing_query = select(DetectionRule).where(
            DetectionRule.rule_id == rule_data["rule_id"]
        )
        existing = await db_session.execute(existing_query)

        if existing.scalar_one_or_none():
            continue  # Skip if exists

        # Create new rule
        rule = DetectionRule(
            rule_id=rule_data["rule_id"],
            rule_name=rule_data["rule_name"],
            rule_type=rule_data["rule_type"],
            rule_pattern=rule_data["rule_pattern"],
            attack_type=rule_data["attack_type"],
            severity=rule_data["severity"],
            weight=rule_data["weight"],
            description=rule_data.get("description"),
            is_active=True,
            created_by="system"
        )

        db_session.add(rule)
        created_count += 1

    await db_session.commit()

    return created_count
