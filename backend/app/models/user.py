"""
User models for database.

This module contains SQLAlchemy models for user-related database tables.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, Integer, Text, JSON, Boolean, ForeignKey, DateTime, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """
    User model.

    Stores user account information and authentication data.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        doc="Unique user identifier"
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
        doc="User email address"
    )

    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
        doc="Username"
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Hashed password"
    )

    # User role and status
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="user",
        index=True,
        doc="User role: user, admin"
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
        doc="Whether the user account is active"
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        doc="Whether the user email is verified"
    )

    # Quota information
    remaining_quota: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="Remaining detection quota"
    )

    total_quota: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="Total purchased quota"
    )

    # Profile information
    full_name: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
        doc="Full name"
    )

    phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        doc="Phone number"
    )

    company: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
        doc="Company name"
    )

    # Timestamps
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Last login timestamp"
    )

    def __repr__(self) -> str:
        return (
            f"<User(id={self.id}, user_id={self.user_id}, "
            f"email={self.email}, role={self.role})>"
        )


class Order(Base, TimestampMixin):
    """
    Order model.

    Stores purchase orders for detection quota.
    """

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    order_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        doc="Unique order identifier"
    )

    user_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("users.user_id"),
        nullable=False,
        index=True,
        doc="User ID who placed the order"
    )

    # Package information
    package_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="Package name"
    )

    quota_amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="Amount of quota purchased"
    )

    # Pricing
    price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        doc="Order price in CNY"
    )

    # Order status
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
        doc="Order status: pending, paid, cancelled, refunded"
    )

    payment_method: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Payment method"
    )

    # Payment information
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Payment timestamp"
    )

    transaction_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Third-party transaction ID"
    )

    def __repr__(self) -> str:
        return (
            f"<Order(id={self.id}, order_id={self.order_id}, "
            f"user_id={self.user_id}, status={self.status})>"
        )


class Package(Base, TimestampMixin):
    """
    Package model.

    Defines pricing packages for detection quota.
    """

    __tablename__ = "packages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    package_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        doc="Unique package identifier"
    )

    package_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="Package name"
    )

    quota_amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="Amount of detection quota"
    )

    price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        doc="Price in CNY"
    )

    discount: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        doc="Discount percentage (0-100)"
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
        doc="Whether the package is available"
    )

    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Package description"
    )

    features: Mapped[dict] = mapped_column(
        JSON,
        default=list,
        doc="List of package features"
    )

    def __repr__(self) -> str:
        return (
            f"<Package(id={self.id}, package_id={self.package_id}, "
            f"package_name={self.package_name}, price={self.price})>"
        )


class DetectionUsage(Base, TimestampMixin):
    """
    Detection usage model.

    Tracks detection quota usage for users.
    """

    __tablename__ = "detection_usage"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    usage_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        doc="Unique usage record identifier"
    )

    user_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("users.user_id"),
        nullable=False,
        index=True,
        doc="User ID"
    )

    request_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("detection_records.request_id"),
        nullable=False,
        index=True,
        doc="Associated detection request ID"
    )

    quota_cost: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        doc="Quota cost for this detection"
    )

    remaining_quota: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="Remaining quota after this detection"
    )

    def __repr__(self) -> str:
        return (
            f"<DetectionUsage(id={self.id}, usage_id={self.usage_id}, "
            f"user_id={self.user_id}, quota_cost={self.quota_cost})>"
        )
