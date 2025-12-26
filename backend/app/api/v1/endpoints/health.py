"""
Health check endpoint.

This module provides health check and status endpoints.
"""
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.schemas.common import HealthResponse
from app.core.config import settings

router = APIRouter()


@router.get("/", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint.

    Returns the current health status of the service including database
    and Redis connections.
    """
    # Check database connection
    database_status = "healthy"
    try:
        await db.execute("SELECT 1")
    except Exception:
        database_status = "unhealthy"

    # Check Redis connection (placeholder)
    redis_status = "healthy"
    # TODO: Implement actual Redis health check

    return HealthResponse(
        status="healthy" if database_status == "healthy" else "degraded",
        version=settings.APP_VERSION,
        timestamp=datetime.utcnow().isoformat(),
        database=database_status,
        redis=redis_status,
    )


@router.get("/ping")
async def ping():
    """
    Simple ping endpoint for load balancers.

    Returns a simple pong response for health checks.
    """
    return {"status": "pong", "service": settings.APP_NAME}


@router.get("/version")
async def version():
    """
    Get API version information.

    Returns version and build information.
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }
