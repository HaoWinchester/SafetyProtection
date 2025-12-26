"""
Detection models for database.

This module contains SQLAlchemy models for detection-related database tables.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, Integer, Text, JSON, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class DetectionRecord(Base, TimestampMixin):
    """
    Detection record model.

    Stores all detection results and related information.
    """

    __tablename__ = "detection_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Request information
    request_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        doc="Unique request identifier"
    )

    user_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        doc="User ID who made the request"
    )

    # Input data
    input_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Input text for detection"
    )

    input_hash: Mapped[str] = mapped_column(
        String(64),
        index=True,
        doc="Hash of input text for caching"
    )

    # Detection results
    is_compliant: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        index=True,
        doc="Whether the input is compliant"
    )

    risk_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        index=True,
        doc="Risk score (0-1)"
    )

    risk_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        doc="Risk level: low, medium, high, critical"
    )

    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        doc="Detection confidence (0-1)"
    )

    # Detailed results
    attack_types: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        doc="Detected attack types and their scores"
    )

    detection_details: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        doc="Detailed detection information from each layer"
    )

    # Processing information
    processing_time_ms: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        doc="Processing time in milliseconds"
    )

    layer_results: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        doc="Results from each detection layer"
    )

    # Model information
    model_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Name of the detection model used"
    )

    model_version: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Version of the detection model"
    )

    # Metadata
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="IP address of the request"
    )

    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="User agent string"
    )

    # Indexes
    __table_args__ = (
        Index("idx_created_at", "created_at"),
        Index("idx_risk_level_created", "risk_level", "created_at"),
        Index("idx_user_id_created", "user_id", "created_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<DetectionRecord(id={self.id}, request_id={self.request_id}, "
            f"risk_level={self.risk_level}, risk_score={self.risk_score})>"
        )


class ThreatSample(Base, TimestampMixin):
    """
    Threat sample model.

    Stores confirmed threat samples for training and analysis.
    """

    __tablename__ = "threat_samples"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    sample_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        doc="Unique sample identifier"
    )

    attack_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        doc="Type of attack"
    )

    attack_category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Category of attack"
    )

    sample_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Sample attack text"
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        doc="Whether the sample is verified"
    )

    verified_by: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        doc="User ID who verified the sample"
    )

    verified_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        doc="Timestamp when sample was verified"
    )

    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        doc="Severity level"
    )

    tags: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        doc="Tags for categorization"
    )

    source: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Source of the threat sample"
    )

    def __repr__(self) -> str:
        return (
            f"<ThreatSample(id={self.id}, sample_id={self.sample_id}, "
            f"attack_type={self.attack_type})>"
        )


class DetectionRule(Base, TimestampMixin):
    """
    Detection rule model.

    Stores custom detection rules and patterns.
    """

    __tablename__ = "detection_rules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    rule_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        doc="Unique rule identifier"
    )

    rule_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        doc="Name of the rule"
    )

    rule_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Type of rule: keyword, regex, pattern"
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
        doc="Whether the rule is active"
    )

    rule_pattern: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Rule pattern or regex"
    )

    attack_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="Associated attack type"
    )

    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        doc="Severity level"
    )

    weight: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        doc="Weight of the rule in scoring"
    )

    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Description of the rule"
    )

    created_by: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        doc="User ID who created the rule"
    )

    updated_by: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        doc="User ID who last updated the rule"
    )

    def __repr__(self) -> str:
        return (
            f"<DetectionRule(id={self.id}, rule_id={self.rule_id}, "
            f"rule_name={self.rule_name}, is_active={self.is_active})>"
        )
