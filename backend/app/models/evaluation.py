"""
Evaluation models for database.

This module contains SQLAlchemy models for evaluation-related database tables.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Text, Boolean, ForeignKey, Index, Enum, Numeric
from sqlalchemy.orm import Mapped, mapped_column
import enum

from app.db.base import Base, TimestampMixin


class EvaluationLevel(str, enum.Enum):
    """Evaluation level enumeration."""
    BASIC = "basic"
    STANDARD = "standard"
    ADVANCED = "advanced"
    EXPERT = "expert"


class EvaluationStatus(str, enum.Enum):
    """Evaluation status enumeration."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class EvaluationConfig(Base, TimestampMixin):
    """
    Evaluation configuration model.

    Stores configuration for evaluating LLM security.
    """

    __tablename__ = "evaluation_configs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    config_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        doc="Unique configuration identifier"
    )

    user_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        doc="User ID who created the configuration"
    )

    # Model configuration
    model_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="Name of the model to evaluate"
    )

    model_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        doc="Type of model (openai, claude, local, etc.)"
    )

    api_endpoint: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        doc="API endpoint for the model"
    )

    api_key: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="API key for authentication (encrypted)"
    )

    # Evaluation parameters
    evaluation_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=EvaluationLevel.STANDARD,
        doc="Evaluation level: basic, standard, advanced, expert"
    )

    concurrent_requests: Mapped[int] = mapped_column(
        Integer,
        default=5,
        doc="Number of concurrent requests"
    )

    timeout_ms: Mapped[int] = mapped_column(
        Integer,
        default=30000,
        doc="Request timeout in milliseconds"
    )

    max_retries: Mapped[int] = mapped_column(
        Integer,
        default=3,
        doc="Maximum number of retries"
    )

    # Additional settings
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Configuration description"
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        doc="Whether the configuration is active"
    )

    def __repr__(self) -> str:
        return (
            f"<EvaluationConfig(id={self.id}, config_id={self.config_id}, "
            f"model_name={self.model_name}, level={self.evaluation_level})>"
        )


class TestCase(Base, TimestampMixin):
    """
    Test case model.

    Stores test cases for security evaluation.
    """

    __tablename__ = "test_cases"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    case_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        doc="Unique test case identifier"
    )

    # Classification
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Attack category (injection, jailbreak, data_leakage, etc.)"
    )

    attack_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        doc="Specific attack type"
    )

    evaluation_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        doc="Minimum evaluation level required"
    )

    # Test content
    prompt: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Test prompt to send to the model"
    )

    expected_result: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        doc="Expected result (SAFE_ATTACK, SAFE_PASS)"
    )

    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        doc="Severity level (low, medium, high, critical)"
    )

    # Metadata
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Test case description"
    )

    tags: Mapped[dict] = mapped_column(
        default=dict,
        doc="Tags for categorization"
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
        doc="Whether the test case is active"
    )

    # Validation
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        doc="Whether the test case is verified"
    )

    verified_by: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        doc="User ID who verified the case"
    )

    # Indexes
    __table_args__ = (
        Index("idx_category_level", "category", "evaluation_level"),
        Index("idx_attack_type", "attack_type"),
    )

    def __repr__(self) -> str:
        return (
            f"<TestCase(id={self.id}, case_id={self.case_id}, "
            f"category={self.category}, attack_type={self.attack_type})>"
        )


class EvaluationResult(Base, TimestampMixin):
    """
    Evaluation result model.

    Stores results of security evaluations.
    """

    __tablename__ = "evaluation_results"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    evaluation_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        doc="Unique evaluation identifier"
    )

    config_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("evaluation_configs.id"),
        nullable=False,
        index=True,
        doc="Reference to evaluation configuration"
    )

    user_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        doc="User who initiated the evaluation"
    )

    # Execution info
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=EvaluationStatus.PENDING,
        index=True,
        doc="Evaluation status"
    )

    started_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        doc="Evaluation start time"
    )

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        doc="Evaluation completion time"
    )

    # Test statistics
    total_cases: Mapped[int] = mapped_column(
        Integer,
        default=0,
        doc="Total number of test cases"
    )

    executed_cases: Mapped[int] = mapped_column(
        Integer,
        default=0,
        doc="Number of executed test cases"
    )

    passed_cases: Mapped[int] = mapped_column(
        Integer,
        default=0,
        doc="Number of passed test cases"
    )

    failed_cases: Mapped[int] = mapped_column(
        Integer,
        default=0,
        doc="Number of failed test cases"
    )

    # Security metrics
    safety_score: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        doc="Overall safety score (0-100)"
    )

    safety_level: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        doc="Safety level (HIGH, MEDIUM, LOW)"
    )

    # Distributions
    attack_distribution: Mapped[dict] = mapped_column(
        default=dict,
        doc="Attack type distribution"
    )

    risk_distribution: Mapped[dict] = mapped_column(
        default=dict,
        doc="Risk level distribution"
    )

    # Error information
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Error message if evaluation failed"
    )

    def __repr__(self) -> str:
        return (
            f"<EvaluationResult(id={self.id}, evaluation_id={self.evaluation_id}, "
            f"status={self.status}, safety_score={self.safety_score})>"
        )


class EvaluationCaseResult(Base, TimestampMixin):
    """
    Individual test case result model.

    Stores results for each test case in an evaluation.
    """

    __tablename__ = "evaluation_case_results"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    result_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        doc="Unique result identifier"
    )

    evaluation_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("evaluation_results.id"),
        nullable=False,
        index=True,
        doc="Reference to evaluation result"
    )

    case_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("test_cases.id"),
        nullable=False,
        doc="Reference to test case"
    )

    # Execution results
    model_response: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Model's response to the test prompt"
    )

    is_passed: Mapped[Optional[bool]] = mapped_column(
        Boolean,
        nullable=True,
        doc="Whether the test case passed (model was secure)"
    )

    risk_score: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 4),
        nullable=True,
        doc="Risk score from detection (0-1)"
    )

    risk_level: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        doc="Risk level from detection"
    )

    threat_category: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Detected threat category"
    )

    # Detection details
    detection_details: Mapped[dict] = mapped_column(
        default=dict,
        doc="Detailed detection information"
    )

    processing_time_ms: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
        doc="Processing time in milliseconds"
    )

    # Error info
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Error message if execution failed"
    )

    def __repr__(self) -> str:
        return (
            f"<EvaluationCaseResult(id={self.id}, result_id={self.result_id}, "
            f"is_passed={self.is_passed}, risk_score={self.risk_score})>"
        )
