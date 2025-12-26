"""
Dependency injection utilities for FastAPI.

This module provides common dependencies used across the application.
"""
from typing import AsyncGenerator, Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import verify_token
from app.db.session import async_session


# HTTP Bearer token scheme
security = HTTPBearer()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get database session.

    Yields:
        AsyncSession: Database session
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Dependency to get current user ID from JWT token.

    Args:
        credentials: HTTP Bearer credentials

    Returns:
        str: User ID

    Raises:
        HTTPException: If token is invalid
    """
    token = credentials.credentials
    payload = verify_token(token, token_type="access")

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


async def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    )
) -> Optional[str]:
    """
    Dependency to get optional user ID from JWT token.

    Args:
        credentials: Optional HTTP Bearer credentials

    Returns:
        Optional[str]: User ID if token is valid, None otherwise
    """
    if credentials is None:
        return None

    token = credentials.credentials
    payload = verify_token(token, token_type="access")

    if payload is None:
        return None

    user_id: Optional[str] = payload.get("sub")
    return user_id


def verify_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    """
    Verify API key from header.

    Args:
        x_api_key: API key from X-API-Key header

    Returns:
        str: API key

    Raises:
        HTTPException: If API key is missing or invalid
    """
    if x_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is missing",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # TODO: Implement actual API key validation against database
    # For now, just check if it's not empty
    if not x_api_key or len(x_api_key) < 10:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    return x_api_key


def rate_limit_check(
    x_rate_limit_remaining: Optional[int] = Header(None)
) -> None:
    """
    Check rate limit headers.

    Args:
        x_rate_limit_remaining: Remaining requests from rate limit header

    Raises:
        HTTPException: If rate limit is exceeded
    """
    if x_rate_limit_remaining is not None and x_rate_limit_remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
        )


class PermissionChecker:
    """
    Permission checker dependency.

    Args:
        required_permissions: List of required permissions
    """

    def __init__(self, required_permissions: list[str]) -> None:
        self.required_permissions = required_permissions

    def __call__(self, user_id: str = Depends(get_current_user_id)) -> str:
        """
        Check if user has required permissions.

        Args:
            user_id: Current user ID

        Returns:
            str: User ID if permissions are valid

        Raises:
            HTTPException: If user lacks required permissions
        """
        # TODO: Implement actual permission checking against database
        # For now, just return user_id
        return user_id


# Common permission checkers
require_admin = PermissionChecker(["admin"])
require_user = PermissionChecker(["user"])
require_analyst = PermissionChecker(["analyst"])
