"""
User schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None


class UserCreate(UserBase):
    """User registration schema."""
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field(default="user", pattern="^(user|admin)$")


class UserLogin(BaseModel):
    """User login schema."""
    username: str
    password: str


class UserUpdate(BaseModel):
    """User update schema."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None


class UserResponse(UserBase):
    """User response schema."""
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    role: str
    is_active: bool
    is_verified: bool
    remaining_quota: int
    total_quota: int
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None


class UserProfile(UserResponse):
    """Extended user profile with additional info."""
    total_orders: int = 0
    total_detections: int = 0


class Token(BaseModel):
    """Authentication token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Token data."""
    user_id: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[datetime] = None


# Package schemas
class PackageBase(BaseModel):
    """Base package schema."""
    package_name: str
    quota_amount: int
    price: float
    discount: float = 0.0
    description: Optional[str] = None
    features: list = []


class PackageCreate(PackageBase):
    """Package creation schema (admin only)."""
    pass


class PackageResponse(PackageBase):
    """Package response schema."""
    model_config = ConfigDict(from_attributes=True)

    package_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


# Order schemas
class OrderBase(BaseModel):
    """Base order schema."""
    package_id: str


class OrderCreate(OrderBase):
    """Order creation schema."""
    payment_method: Optional[str] = None


class OrderResponse(BaseModel):
    """Order response schema."""
    model_config = ConfigDict(from_attributes=True)

    order_id: str
    user_id: str
    package_name: str
    quota_amount: int
    price: float
    status: str
    payment_method: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class OrderListResponse(BaseModel):
    """Order list response."""
    orders: list[OrderResponse]
    total: int
    page: int
    page_size: int


# Quota schemas
class QuotaInfo(BaseModel):
    """User quota information."""
    remaining_quota: int
    total_quota: int
    used_quota: int
    quota_percentage: float


class QuotaUpdate(BaseModel):
    """Admin quota update schema."""
    amount: int = Field(..., gt=0)
    reason: Optional[str] = None


# Detection risk categories
class ThreatCategory(BaseModel):
    """Threat category information."""
    category_id: str
    category_name: str
    description: str
    severity: str
    examples: list[str] = []


class DetectionRiskResponse(BaseModel):
    """Enhanced detection response with risk categories."""
    request_id: str
    timestamp: str
    is_compliant: bool
    risk_score: float
    risk_level: str
    threat_categories: list[ThreatCategory] = []
    detection_details: dict
    recommendation: str
    processing_time_ms: float
    quota_used: int = 1
