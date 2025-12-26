"""
Database base configuration.

This module contains the SQLAlchemy base class and all model imports.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all database models."""

    pass


class TimestampMixin:
    """
    Mixin class for adding timestamp fields to models.

    This provides created_at and updated_at timestamps for all models.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp when the record was created"
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        doc="Timestamp when the record was last updated"
    )


class SoftDeleteMixin:
    """
    Mixin class for soft delete functionality.

    This provides is_deleted and deleted_at fields for soft delete.
    """

    is_deleted: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
        index=True,
        doc="Whether the record is soft deleted"
    )

    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp when the record was soft deleted"
    )
