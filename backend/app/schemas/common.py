"""
Common schemas for API.

This module contains common schemas used across different API endpoints.
"""
from typing import Any, Optional
from pydantic import BaseModel, Field


class SuccessResponse(BaseModel):
    """Standard success response schema."""

    success: bool = True
    message: str = Field(description="Success message")
    data: Optional[Any] = Field(default=None, description="Response data")


class ErrorResponse(BaseModel):
    """Standard error response schema."""

    success: bool = False
    error: str = Field(description="Error type")
    message: str = Field(description="Error message")
    detail: Optional[str] = Field(default=None, description="Detailed error information")


class ValidationErrorResponse(BaseModel):
    """Validation error response schema."""

    success: bool = False
    error: str = Field(default="validation_error")
    message: str = Field(description="Validation error message")
    detail: list[dict[str, Any]] = Field(description="Field-level validation errors")


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str = Field(description="Service status")
    version: str = Field(description="API version")
    timestamp: str = Field(description="Current timestamp")
    database: str = Field(description="Database connection status")
    redis: str = Field(description="Redis connection status")


class PaginationParams(BaseModel):
    """Pagination parameters schema."""

    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Number of items per page")

    @property
    def skip(self) -> int:
        """Calculate offset for database query."""
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        """Get limit for database query."""
        return self.page_size


class PaginatedResponse(BaseModel):
    """Paginated response schema."""

    total: int = Field(description="Total number of items")
    page: int = Field(description="Current page number")
    page_size: int = Field(description="Number of items per page")
    total_pages: int = Field(description="Total number of pages")
    data: list[Any] = Field(description="List of items")


class MessageResponse(BaseModel):
    """Simple message response schema."""

    message: str = Field(description="Response message")
