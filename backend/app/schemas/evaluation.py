"""
Evaluation schemas for request/response validation.

This module contains Pydantic schemas for evaluation-related operations.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
import enum


class EvaluationLevel(str, enum.Enum):
    """Evaluation level options."""
    BASIC = "basic"
    STANDARD = "standard"
    ADVANCED = "advanced"
    EXPERT = "expert"


class EvaluationStatus(str, enum.Enum):
    """Evaluation status options."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# ============== Evaluation Config Schemas ==============

class EvaluationConfigCreate(BaseModel):
    """Schema for creating evaluation configuration."""

    model_name: str = Field(..., description="Name of the model to evaluate")
    model_type: str = Field(..., description="Type of model")
    api_endpoint: str = Field(..., description="API endpoint")
    api_key: Optional[str] = Field(None, description="API key (will be encrypted)")
    evaluation_level: EvaluationLevel = Field(EvaluationLevel.STANDARD, description="Evaluation level")
    concurrent_requests: int = Field(5, ge=1, le=20, description="Number of concurrent requests")
    timeout_ms: int = Field(30000, ge=1000, le=300000, description="Request timeout in ms")
    max_retries: int = Field(3, ge=0, le=10, description="Maximum retries")
    description: Optional[str] = Field(None, description="Configuration description")


class EvaluationConfigUpdate(BaseModel):
    """Schema for updating evaluation configuration."""

    model_name: Optional[str] = None
    model_type: Optional[str] = None
    api_endpoint: Optional[str] = None
    api_key: Optional[str] = None
    evaluation_level: Optional[EvaluationLevel] = None
    concurrent_requests: Optional[int] = Field(None, ge=1, le=20)
    timeout_ms: Optional[int] = Field(None, ge=1000, le=300000)
    max_retries: Optional[int] = Field(None, ge=0, le=10)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class EvaluationConfigResponse(BaseModel):
    """Schema for evaluation configuration response."""

    id: int
    config_id: str
    user_id: Optional[str]
    model_name: str
    model_type: str
    api_endpoint: str
    # API key is not returned for security
    evaluation_level: str
    concurrent_requests: int
    timeout_ms: int
    max_retries: int
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== Test Case Schemas ==============

class TestCaseCreate(BaseModel):
    """Schema for creating test case."""

    category: str = Field(..., description="Attack category")
    attack_type: str = Field(..., description="Specific attack type")
    evaluation_level: EvaluationLevel = Field(..., description="Minimum level required")
    prompt: str = Field(..., min_length=1, description="Test prompt")
    expected_result: str = Field(..., description="Expected result (SAFE_ATTACK/SAFE_PASS)")
    severity: str = Field(..., description="Severity level")
    description: Optional[str] = None
    tags: Dict[str, Any] = Field(default_factory=dict)


class TestCaseUpdate(BaseModel):
    """Schema for updating test case."""

    category: Optional[str] = None
    attack_type: Optional[str] = None
    evaluation_level: Optional[EvaluationLevel] = None
    prompt: Optional[str] = Field(None, min_length=1)
    expected_result: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class TestCaseResponse(BaseModel):
    """Schema for test case response."""

    id: int
    case_id: str
    category: str
    attack_type: str
    evaluation_level: str
    prompt: str
    expected_result: str
    severity: str
    description: Optional[str]
    tags: Dict[str, Any]
    is_active: bool
    is_verified: bool
    verified_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== Evaluation Execution Schemas ==============

class EvaluationStartRequest(BaseModel):
    """Schema for starting an evaluation."""

    config_id: str = Field(..., description="Configuration ID to use")
    evaluation_level: Optional[EvaluationLevel] = Field(None, description="Override evaluation level")


class EvaluationProgressResponse(BaseModel):
    """Schema for evaluation progress."""

    evaluation_id: str
    status: EvaluationStatus
    total_cases: int
    executed_cases: int
    passed_cases: int
    failed_cases: int
    progress_percentage: float
    current_case_id: Optional[str] = None
    started_at: Optional[datetime] = None
    estimated_completion: Optional[datetime] = None


# ============== Evaluation Result Schemas ==============

class EvaluationResultResponse(BaseModel):
    """Schema for evaluation result response."""

    id: int
    evaluation_id: str
    config_id: int
    user_id: Optional[str]
    status: EvaluationStatus
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    total_cases: int
    executed_cases: int
    passed_cases: int
    failed_cases: int
    safety_score: Optional[float]
    safety_level: Optional[str]
    attack_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CaseResultDetail(BaseModel):
    """Schema for individual case result."""

    id: int
    result_id: str
    case_id: int
    model_response: Optional[str]
    is_passed: Optional[bool]
    risk_score: Optional[float]
    risk_level: Optional[str]
    threat_category: Optional[str]
    detection_details: Dict[str, Any]
    processing_time_ms: Optional[float]
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class EvaluationFullResult(BaseModel):
    """Schema for complete evaluation result with case details."""

    evaluation: EvaluationResultResponse
    case_results: List[CaseResultDetail]
